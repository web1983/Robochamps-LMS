/**
 * Build API URLs for RTK Query.
 * - Local dev: leave VITE_API_URL unset → `/api/...` (Vite proxy to localhost:8080)
 * - Production: set VITE_API_URL to your backend origin, e.g. https://your-api.vercel.app
 */
const serverOrigin = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return serverOrigin ? `${serverOrigin}${normalized}` : normalized;
}
