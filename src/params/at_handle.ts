export function match(param: string): boolean {
  return /^@[a-z0-9._-]{1,32}$/i.test(param);
}
