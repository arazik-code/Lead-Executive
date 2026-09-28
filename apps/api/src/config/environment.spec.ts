import assert from 'node:assert/strict';
import test from 'node:test';
import { validateEnvironment } from './environment';

const validProduction:NodeJS.ProcessEnv={NODE_ENV:'production',AUTH_MODE:'oidc',DATABASE_URL:'postgres://crm:secret@db.example.com:5432/crm',ORGANIZATION_ID:'00000000-0000-4000-8000-000000000001',OIDC_ISSUER_URL:'https://accounts.google.com',OIDC_AUDIENCE:'client-id.apps.googleusercontent.com',OIDC_JWKS_URL:'https://www.googleapis.com/oauth2/v3/certs',OIDC_EMAIL_DOMAIN:'company.com',CORS_ORIGINS:'https://crm.company.com'};

test('accepts complete production configuration without optional WhatsApp credentials',()=>{
  assert.doesNotThrow(()=>validateEnvironment(validProduction));
});

test('requires explicit Google Workspace identity and secure browser origins in production',()=>{
  assert.throws(()=>validateEnvironment({...validProduction,OIDC_EMAIL_DOMAIN:'',CORS_ORIGINS:'*'}),/OIDC_EMAIL_DOMAIN.*CORS_ORIGINS/);
});

test('rejects development authentication and partial WhatsApp credentials in production',()=>{
  assert.throws(()=>validateEnvironment({...validProduction,AUTH_MODE:'development'}),/AUTH_MODE/);
  assert.throws(()=>validateEnvironment({...validProduction,WHATSAPP_ACCESS_TOKEN:'secret'}),/WHATSAPP_ACCESS_TOKEN/);
});

test('leaves non-production runtime configuration provider-neutral',()=>{
  assert.doesNotThrow(()=>validateEnvironment({NODE_ENV:'development'}));
});
