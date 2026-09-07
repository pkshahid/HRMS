/** @type {import('next').NextConfig} */

// basePath is a static runtime config — Next.js cannot derive it per-request
// from the X-Forwarded-Prefix header. Set it explicitly via either:
//   NEXT_PUBLIC_BASE_PATH=/evm            (preferred, explicit)
//   NEXTAUTH_URL=https://host/evm         (fallback: path extracted from URL)
function resolveBasePath() {
  const explicit = process.env.NEXT_PUBLIC_BASE_PATH;
  if (explicit) return explicit;

  const url = process.env.NEXTAUTH_URL;
  if (url) {
    try {
      const { pathname } = new URL(url);
      const path = pathname.replace(/\/+$/, ""); // strip trailing slash
      if (path && path !== "/") return path;
    } catch {
      // invalid URL — ignore
    }
  }
  return "";
}

const basePath = resolveBasePath();

const nextConfig = {
  // When served behind a reverse proxy under a sub-path (e.g. https://host/evm),
  // all routes (including /api/auth/* and the NextAuth signIn redirect) are
  // prefixed with basePath so the proxy doesn't 404 on redirects.
  ...(basePath ? { basePath } : {}),
  // Trust proxy headers so req.headers.host / x-forwarded-proto are honored
  // by NextAuth when constructing absolute callback URLs.
};

export default nextConfig;
