const COMBINING_MARKS = /[̀-ͯ]/g;
const NON_SLUG_CHARS = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

/**
 * Slug used to build the `data-tour` anchors the guided tutorials select on.
 * Sidebar names include user-typed values (inbox, team, label and folder
 * names), so every character that would break a `[data-tour="..."]` selector —
 * quotes, brackets, accents, punctuation — has to collapse into a hyphen, not
 * just whitespace.
 * @param {string} name
 * @returns {string}
 */
export const toTourSlug = (name = '') =>
  String(name)
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(NON_SLUG_CHARS, '-')
    .replace(EDGE_HYPHENS, '');

/**
 * @param {string} name
 * @param {string} scope group slug that namespaces repeated leaf names
 * @returns {string|null}
 */
export const toTourAnchor = (name, scope = '') => {
  const slug = toTourSlug(name);
  if (!slug) return null;

  const scoped =
    scope && !slug.startsWith(`${scope}-`) ? `${scope}-${slug}` : slug;

  return `sidebar-${scoped}`;
};
