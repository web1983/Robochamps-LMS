/**
 * Build API URLs for RTK Query.
 * - Local dev: leave VITE_API_URL unset → `/api/v1/...` (Vite proxy → localhost:8080)
 * - Production: VITE_API_URL = site origin only, e.g. https://robochamps-lms.vercel.app
 *   (NOT .../api/v1 — that would duplicate the path)
 */
const serverOrigin = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function apiUrl(path) {
  let normalized = path.startsWith("/") ? path : `/${path}`;

  if (!serverOrigin) {
    return normalized;
  }

  // If env is .../api/v1 but path is also /api/v1/..., avoid /api/v1/api/v1/...
  if (serverOrigin.endsWith("/api/v1") && normalized.startsWith("/api/v1")) {
    normalized = normalized.slice("/api/v1".length) || "/";
    if (!normalized.startsWith("/")) {
      normalized = `/${normalized}`;
    }
  }

  return `${serverOrigin}${normalized}`;
}
