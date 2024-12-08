import { encodeHex } from "jsr:@std/encoding/hex";
import { PasswordDetails } from "./types.ts";
const v1VersionString = "sha-256-1.0";

export function createSalt(): string {
  return encodeHex(crypto.getRandomValues(new Uint8Array(16)));
}

async function encryptPasswordV1(
  password: string,
  salt: string,
): Promise<PasswordDetails> {
  const messageBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", messageBuffer);
  const hash = encodeHex(hashBuffer);
  return {
    hash,
    salt,
    version: v1VersionString,
  };
}

export function getEncrypterByType(type: string) {
  switch (type) {
    case v1VersionString:
      return encryptPasswordV1;
    default:
      throw new Error(`Unsupported encryption type: ${type}`);
  }
}

export const currentEncrypter = getEncrypterByType(v1VersionString);
