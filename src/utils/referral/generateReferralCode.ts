export function generateReferralCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }

  return result;
}

export function generateUniqueReferralCode(existingCodes: Set<string>) {
  let code;
  do {
    code = generateReferralCode();
  } while (existingCodes.has(code));

  return code;
}
