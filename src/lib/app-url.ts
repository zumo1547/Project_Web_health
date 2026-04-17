const DEFAULT_APP_BASE_URL = "https://seniorhealthcheck.xyz";

function normalizeUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

export function getAppBaseUrl() {
  return (
    normalizeUrl(process.env.APP_URL) ??
    normalizeUrl(process.env.NEXTAUTH_URL) ??
    normalizeUrl(
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ) ??
    DEFAULT_APP_BASE_URL
  );
}
