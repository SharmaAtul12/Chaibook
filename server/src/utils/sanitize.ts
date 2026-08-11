/**
 * Removes NUL (0x00) bytes from a string.
 *
 * PostgreSQL `text`/`varchar`/`jsonb` columns cannot store the NUL character and
 * reject it with error code 22021 ("invalid byte sequence for encoding UTF8:
 * 0x00"). Extracted PDF text (and occasionally scraped web/YouTube content)
 * frequently contains stray NUL bytes, so we strip them before persisting.
 *
 * Only 0x00 is removed; all other characters (including other whitespace and
 * unicode) are preserved unchanged.
 *
 * @param value - The string to sanitize (null/undefined pass through untouched)
 * @returns The input with all NUL bytes removed
 */
export function stripNullBytes<T extends string | null | undefined>(
    value: T,
): T {
    if (typeof value !== "string") {
        return value;
    }

    return value.replace(/\u0000/g, "") as T;
}
