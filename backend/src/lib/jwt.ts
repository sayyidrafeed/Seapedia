import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function signJwt(payload: { userId: string; sessionId: string }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

export async function verifyJwt(
  token: string,
): Promise<{ userId: string; sessionId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; sessionId: string };
  } catch {
    return null;
  }
}
