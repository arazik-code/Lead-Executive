import { z } from 'zod';

const uuid = z.string().uuid();
const productionSchema = z.object({
  NODE_ENV: z.literal('production'),
  AUTH_MODE: z.literal('oidc'),
  DATABASE_URL: z.string().url().refine((value) => ['postgres:', 'postgresql:'].includes(new URL(value).protocol), 'DATABASE_URL must use PostgreSQL'),
  ORGANIZATION_ID: uuid,
  OIDC_ISSUER_URL: z.literal('https://accounts.google.com'),
  OIDC_AUDIENCE: z.string().min(1),
  OIDC_JWKS_URL: z.string().url().refine((value) => new URL(value).protocol === 'https:', 'OIDC_JWKS_URL must use HTTPS'),
  OIDC_EMAIL_DOMAIN: z.string().min(3).refine((value) => !value.includes('@') && value.includes('.'), 'Set the Workspace domain, such as company.com'),
  CORS_ORIGINS: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_GRAPH_API_VERSION: z.string().optional(),
}).superRefine((config, context) => {
  const origins = config.CORS_ORIGINS.split(',').map((origin) => origin.trim());
  if (!origins.length || origins.some((origin) => {
    try { const url = new URL(origin); return url.protocol !== 'https:' || url.origin !== origin || origin.includes('*'); }
    catch { return true; }
  })) context.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'Production CORS origins must be explicit HTTPS origins without wildcards' });
  const whatsappValues = [config.WHATSAPP_PHONE_NUMBER_ID,config.WHATSAPP_VERIFY_TOKEN,config.WHATSAPP_APP_SECRET,config.WHATSAPP_ACCESS_TOKEN,config.WHATSAPP_GRAPH_API_VERSION];
  if (whatsappValues.some(Boolean) && whatsappValues.some((value) => !value)) context.addIssue({ code: 'custom', path: ['WHATSAPP_ACCESS_TOKEN'], message: 'Configure all WhatsApp Cloud API credentials together, or leave them all empty' });
  if (config.WHATSAPP_GRAPH_API_VERSION && !/^v\d+\.\d+$/.test(config.WHATSAPP_GRAPH_API_VERSION)) context.addIssue({ code: 'custom', path: ['WHATSAPP_GRAPH_API_VERSION'], message: 'Use a versioned Graph API value such as v24.0' });
});

export function validateEnvironment(environment: NodeJS.ProcessEnv = process.env) {
  if (environment.NODE_ENV !== 'production') return;
  const result = productionSchema.safeParse(environment);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`).join('; ');
    throw new Error(`Invalid production configuration: ${details}`);
  }
}
