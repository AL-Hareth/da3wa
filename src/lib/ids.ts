const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

/** URL-safe random id using the Web Crypto API (works in Node and the browser). */
export function randomId(length = 21, alphabet = ALPHABET): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export const newId = () => randomId(21);
