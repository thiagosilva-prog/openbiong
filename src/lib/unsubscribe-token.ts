import { env } from '@/env.mjs';
import { createHmac, timingSafeEqual } from 'node:crypto';

export function createUnsubscribeToken(userId: string) {
  return createHmac('sha256', env.BETTER_AUTH_SECRET)
    .update(userId)
    .digest('hex');
}

export function verifyUnsubscribeToken(userId: string, token: string) {
  const expected = createUnsubscribeToken(userId);
  const expectedBuf = Buffer.from(expected, 'hex');
  const tokenBuf = Buffer.from(token, 'hex');
  return (
    expectedBuf.length === tokenBuf.length &&
    timingSafeEqual(expectedBuf, tokenBuf)
  );
}
