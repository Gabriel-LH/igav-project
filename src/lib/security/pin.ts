import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

export function assertValidPin(pin: string) {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error("El PIN debe tener entre 4 y 6 digitos numericos.");
  }
}

export async function hashPin(pin: string) {
  assertValidPin(pin);

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(pin, salt, 64)) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPin(pin: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const derivedKey = (await scrypt(pin, salt, 64)) as Buffer;
  const hashBuffer = Buffer.from(hash, "hex");

  if (hashBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(hashBuffer, derivedKey);
}
