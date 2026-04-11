/**
 * Levenshtein Distance Algorithm
 *
 * Calculates the minimum number of single-character edits (insertions, deletions, or substitutions)
 * required to change one string into another.
 *
 * Used for detecting duplicate ingredients with similar names.
 */

/**
 * Calculate Levenshtein distance between two strings
 *
 * @param a - First string
 * @param b - Second string
 * @returns The Levenshtein distance (number of edits needed)
 *
 * @example
 * ```typescript
 * levenshtein('kitten', 'sitting'); // 3
 * levenshtein('토마토', '토마또'); // 1
 * ```
 */
export function levenshtein(a: string, b: string): number {
  // Create a matrix to store distances
  const matrix: number[][] = [];

  // Initialize first column (distance from empty string)
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row (distance from empty string)
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        // Characters match, no edit needed
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        // Characters don't match, find minimum edit
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0.0 to 1.0)
 *
 * @param a - First string
 * @param b - Second string
 * @returns Similarity score (1.0 = identical, 0.0 = completely different)
 *
 * @example
 * ```typescript
 * levenshteinSimilarity('토마토', '토마토'); // 1.0
 * levenshteinSimilarity('토마토', '토마또'); // 0.67
 * levenshteinSimilarity('돼지고기', '소고기'); // 0.5
 * ```
 */
export function levenshteinSimilarity(a: string, b: string): number {
  // Normalize to lowercase for case-insensitive comparison
  const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);

  // Avoid division by zero
  if (maxLen === 0) return 1.0;

  // Convert distance to similarity (1.0 - normalized distance)
  return 1 - distance / maxLen;
}

/**
 * Check if two strings are similar based on threshold
 *
 * @param a - First string
 * @param b - Second string
 * @param threshold - Similarity threshold (default: 0.8)
 * @returns True if similarity >= threshold
 *
 * @example
 * ```typescript
 * isSimilar('새송이버섯', '새송이'); // true (>0.8 similarity)
 * isSimilar('토마토', '감자'); // false (<0.8 similarity)
 * ```
 */
export function isSimilar(a: string, b: string, threshold: number = 0.8): boolean {
  return levenshteinSimilarity(a, b) >= threshold;
}
