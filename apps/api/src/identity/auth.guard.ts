import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { verify, JwtHeader } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { DatabaseService } from '../database/database.module';

export interface AuthenticatedUser { id: string; subject: string; email: string; role: 'admin' | 'manager' | 'agent'; }
export interface AuthenticatedRequest extends Request { user: AuthenticatedUser; }

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly database: DatabaseService) {}
  private readonly jwks = process.env.OIDC_JWKS_URL ? jwksClient({ jwksUri: process.env.OIDC_JWKS_URL, timeout: 5000, cache: true, rateLimit: true }) : null;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if ((process.env.AUTH_MODE ?? 'oidc') === 'development' && process.env.NODE_ENV !== 'production') {
      const subject = request.headers['x-dev-user-id'];
      if (typeof subject !== 'string' || !subject.trim()) throw new UnauthorizedException('Development identity header required');
      const result = await this.database.query<{ id: string; email: string; role: AuthenticatedUser['role'] }>(
        'SELECT id, email, role FROM users WHERE auth_subject = $1 AND organization_id = $2 AND active = true',
        [subject, process.env.ORGANIZATION_ID],
      );
      const member = result.rows[0];
      if (!member) throw new UnauthorizedException('Local identity has not been provisioned');
      request.user = { id: member.id, subject, email: member.email, role: member.role };
      return true;
    }
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ') || !this.jwks || !process.env.OIDC_ISSUER_URL || !process.env.OIDC_AUDIENCE) {
      throw new UnauthorizedException('OIDC authentication is not configured');
    }
    try {
      const claims = await new Promise<Record<string, unknown>>((resolve, reject) => {
        verify(authorization.slice(7), (header: JwtHeader, callback) => {
          if (header.alg !== 'RS256' || !header.kid) return callback(new Error('Unsupported signing key'));
          this.jwks!.getSigningKey(header.kid, (error, key) => callback(error, key?.getPublicKey()));
        }, { algorithms: ['RS256'], issuer: process.env.OIDC_ISSUER_URL, audience: process.env.OIDC_AUDIENCE }, (error, payload) => {
          if (error || !payload || typeof payload === 'string') return reject(error ?? new Error('Invalid token'));
          resolve(payload as Record<string, unknown>);
        });
      });
      if (typeof claims.sub !== 'string') throw new Error('Missing subject');
      if (claims.email_verified !== true || typeof claims.email !== 'string') throw new Error('A verified email is required');
      const email = claims.email.trim().toLowerCase();
      const workspaceDomain = process.env.OIDC_EMAIL_DOMAIN?.trim().toLowerCase();
      if ((process.env.NODE_ENV === 'production' && !workspaceDomain) || (workspaceDomain && email.split('@').at(-1) !== workspaceDomain)) {
        throw new Error('Google Workspace domain is not authorized');
      }
      const organizationId=process.env.ORGANIZATION_ID;
      const existing=await this.database.query<{id:string;email:string;role:AuthenticatedUser['role']}>('SELECT id,email,role FROM users WHERE auth_subject=$1 AND organization_id=$2 AND active=true',[claims.sub,organizationId]);
      const member=existing.rows[0]??await this.database.transaction(async(client)=>{
        const bound=await client.query<{id:string;email:string;role:AuthenticatedUser['role']}>(
          `UPDATE users SET auth_subject=$1 WHERE organization_id=$2 AND lower(email)=lower($3) AND auth_subject IS NULL AND active=true
           RETURNING id,email,role`,
          [claims.sub,organizationId,email],
        );
        if(bound.rows[0])return bound.rows[0];
        const raced=await client.query<{id:string;email:string;role:AuthenticatedUser['role']}>('SELECT id,email,role FROM users WHERE auth_subject=$1 AND organization_id=$2 AND active=true',[claims.sub,organizationId]);
        return raced.rows[0];
      });
      if (!member) throw new Error('User is not an active organization member');
      request.user = { id: member.id, subject: claims.sub, email: member.email, role: member.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid identity or inactive organization membership');
    }
  }
}
