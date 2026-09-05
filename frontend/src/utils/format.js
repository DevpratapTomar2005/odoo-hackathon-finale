/**
 * Converts a string to Title Case (capitalizes first letter of each word).
 * Handles null/undefined gracefully.
 * Examples:
 *   "john doe"  → "John Doe"
 *   "software engineer" → "Software Engineer"
 *   "HR_MANAGER" → "Hr Manager"   (use for enums only if needed)
 */
export function toTitleCase(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Returns a properly cased full name from first + last.
 * Falls back to "Unknown" if both are missing.
 */
export function fullName(firstName, lastName, fallback = "Unknown") {
  const name = `${toTitleCase(firstName)} ${toTitleCase(lastName)}`.trim();
  return name || fallback;
}

/**
 * Capitalizes only the very first letter of a string, leaves rest as-is.
 * Useful for sentences or single words.
 */
export function capitalize(str) {
  if (!str) return "";
  return String(str).charAt(0).toUpperCase() + String(str).slice(1).toLowerCase();
}
