import crypto from "crypto";

const DEFAULT_SECRET = "fit-tracker-dev-secret-change-me";

const getEncryptionKey = () => {
  const secret = process.env.APP_SECRET || process.env.ENCRYPTION_KEY || DEFAULT_SECRET;
  return crypto.createHash("sha256").update(secret).digest();
};

export const hashSecret = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

export const maskSecret = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const visible = value.slice(-4);
  return `****${visible}`;
};

export const encryptSecret = (value: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
};

export const decryptSecret = (payload?: string | null) => {
  if (!payload) {
    return null;
  }

  const [ivRaw, tagRaw, encryptedRaw] = payload.split(":");
  if (!ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Invalid encrypted payload format");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivRaw, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};
