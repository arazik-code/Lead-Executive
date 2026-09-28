import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { verifyWhatsAppSignature } from './whatsapp-signature';

test('verifies the Meta HMAC signature against the exact raw request bytes', () => {
  const body = Buffer.from('{"object":"whatsapp_business_account"}');
  const secret = 'test-app-secret';
  const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  assert.equal(verifyWhatsAppSignature(body, signature, secret), true);
  assert.equal(verifyWhatsAppSignature(Buffer.from(`${body.toString()} `), signature, secret), false);
  assert.equal(verifyWhatsAppSignature(body, signature, undefined), false);
});
