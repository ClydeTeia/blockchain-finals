const DEFAULT_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024;

function getAllowedTypes(): string[] {
  const raw = process.env.KYC_ALLOWED_MIME_TYPES;
  if (!raw) {
    return DEFAULT_ALLOWED_TYPES;
  }
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getMaxFileBytes(): number {
  const raw = process.env.KYC_MAX_FILE_BYTES;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_FILE_BYTES;
  }
  return parsed;
}

export function validateKycImageFile(file: File, label: string): string | null {
  if (!file || file.size <= 0) {
    return `${label} file is required.`;
  }

  const allowedTypes = getAllowedTypes();
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return `${label} must be one of: ${allowedTypes.join(", ")}.`;
  }

  const maxFileBytes = getMaxFileBytes();
  if (file.size > maxFileBytes) {
    return `${label} exceeds max size of ${maxFileBytes} bytes.`;
  }

  return null;
}

export function extensionForMimeType(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}
