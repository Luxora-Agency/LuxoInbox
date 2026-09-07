export const MAX_TITLE_LENGTH = 100;

/**
 * Builds the title of a duplicate: `Title (copy)`, then `Title (copy 2)`, and so on.
 * The server rejects a title another template already uses, case-insensitively, so
 * duplicating the same template twice must not collide. The base is trimmed before the
 * suffix is appended, otherwise a 100-character title would lose the suffix instead.
 *
 * @param {string} title title of the template being duplicated.
 * @param {string[]} existingTitles titles already stored in the account.
 * @param {Function} format `(base, copy) => string` renders the localised title.
 * @returns {string} a title no stored template uses.
 */
export const buildDuplicateTitle = (title, existingTitles, format) => {
  const taken = new Set(
    existingTitles.map(existing => String(existing).toLowerCase())
  );
  const fit = copy => {
    const decorated = format(title, copy);
    const overflow = decorated.length - MAX_TITLE_LENGTH;
    return overflow > 0
      ? format(title.slice(0, Math.max(0, title.length - overflow)), copy)
      : decorated;
  };
  let copy = 1;
  while (taken.has(fit(copy).toLowerCase())) copy += 1;
  return fit(copy);
};
