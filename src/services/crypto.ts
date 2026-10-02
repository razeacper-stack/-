/**
 * Cryptographic Utility for Secure Password Hashing & Verification
 * Uses standard WebCrypto API with SHA-256 and unique cryptographic salts.
 */

const getCrypto = (): Crypto => {
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  if (typeof globalThis !== 'undefined' && globalThis.crypto) return globalThis.crypto as Crypto;
  throw new Error('WebCrypto API is not available in this environment');
};

// Generate a cryptographically random hexadecimal salt
export function generateSalt(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Compute SHA-256 hash of password combined with salt
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await getCrypto().subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Verify password match against stored hash and salt
export async function verifyPassword(
  attempt: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const computedHash = await hashPassword(attempt, salt);
  return computedHash === expectedHash;
}
