/** Only same-site relative paths are allowed as post-sign-in redirects. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return "/book";
  if (value.includes("\\") || /[\u0000-\u001f]/u.test(value)) return "/book";
  return value;
}
