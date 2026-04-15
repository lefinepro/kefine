export function match(param: string): boolean {
  return /^@[A-Za-z0-9_-]{16,2048}$/.test(param);
}
