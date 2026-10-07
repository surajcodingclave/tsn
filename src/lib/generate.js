import crypto from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomString(len, alphabet = ALPHABET) {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** Generate a unique, human-friendly login ID with a given prefix. */
export function generateId(prefix, length = 6) {
  const body = randomString(length);
  return prefix ? `${prefix}-${body}` : body;
}

/** Generate a strong random password (at least one lower, upper, digit, symbol). */
export function generatePassword(length = 10) {
  const classes = [
    "abcdefghjkmnpqrstuvwxyz",
    "ABCDEFGHJKMNPQRSTUVWXYZ",
    "23456789",
    "@#!$%&*",
  ];
  const all = classes.join("");
  // start with one guaranteed char from each class, then fill the rest
  const chars = classes.map((set) => set[crypto.randomInt(0, set.length)]);
  while (chars.length < length) chars.push(all[crypto.randomInt(0, all.length)]);
  // shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}