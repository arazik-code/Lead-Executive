import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyWhatsAppSignature(rawBody: Buffer, signature: string | undefined, appSecret: string | undefined): boolean {
  if (!signature || !appSecret || !/^sha256=[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const providedBytes = Buffer.from(signature.toLowerCase());
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}
