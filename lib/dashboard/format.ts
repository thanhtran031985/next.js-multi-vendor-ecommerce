// Display helpers shared by the dashboards. Pure: safe in server and client components.

/** "james.dawson@gmail.com" -> "j****@g**il.com" (masked form used in the dashboard topbar pill). */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "****";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const maskedDomain = domain.length > 7 ? `${domain[0]}**${domain.slice(-6)}` : `${domain[0] ?? ""}**`;
  return `${local[0]}****@${maskedDomain}`;
}

/** Splits a full name at the first space: "Test Khan Jr" -> ["Test", "Khan Jr"]. */
export function splitName(name: string): { first: string; last: string } {
  const trimmed = name.trim();
  const space = trimmed.indexOf(" ");
  if (space === -1) return { first: trimmed, last: "" };
  return { first: trimmed.slice(0, space), last: trimmed.slice(space + 1).trim() };
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** "Sep 29, 2026". UTC so server and client render the same string. */
export function formatDate(date: Date): string {
  return dateFormat.format(date);
}
