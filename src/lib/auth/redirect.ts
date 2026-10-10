const BASE_URL = "https://groundcontrol90.invalid";

export function safeAuthRedirect(next: string | null): string {
  if (!next?.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/cuenta";
  }

  try {
    const url = new URL(next, BASE_URL);
    if (url.origin !== BASE_URL || url.pathname.startsWith("//")) return "/cuenta";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/cuenta";
  }
}
