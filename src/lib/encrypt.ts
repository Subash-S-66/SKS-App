import crypto from "crypto";

const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || Buffer.from(key, "hex").length !== 32) {
    if (process.env.NODE_ENV === "production" && !process.env.BUILD_PHASE) {
      throw new Error("ENCRYPTION_KEY must be a 32-byte hex string");
    }
    return crypto.randomBytes(32).toString("hex");
  }
  return key;
};

const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 16;

export function encrypt(text: string) {
  if (!text) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string) {
  if (!text) return text;

  try {
    const textParts = text.split(":");
    const ivHex = textParts.shift();
    if (!ivHex) return text;

    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  } catch (error) {
    console.error("Decryption failed", error);
    return "";
  }
}
