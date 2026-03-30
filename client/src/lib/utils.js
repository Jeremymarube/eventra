/**
 * Combines multiple class names into a single string
 * Used for conditional and dynamic className management
 */
export function cn(...classes) {
  return classes
    .filter(Boolean)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
