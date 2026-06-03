// In-memory token blacklist (same as original implementation)
// For production, replace with Redis
const blacklist = new Set<string>();

export function addToBlacklist(token: string): void {
  blacklist.add(token);
}

export function isTokenBlacklisted(token: string): boolean {
  return blacklist.has(token);
}

export function removeFromBlacklist(token: string): void {
  blacklist.delete(token);
}

export function clearBlacklist(): void {
  blacklist.clear();
}
