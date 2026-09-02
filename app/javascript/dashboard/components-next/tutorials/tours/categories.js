// The shelves of the tutorial library. `order` doubles as the numbering
// convention for the tours themselves: a tour's `order` is its category's
// `order` plus its position inside the category, so sorting the flat catalog
// by `order` already yields the grouped reading order.
//
// `i18nKey` is the category id in upper snake case; it resolves against
// `TUTORIALS.CATEGORIES.<KEY>.{NAME,DESCRIPTION}`.
export const CATEGORIES = [
  { id: 'start', icon: 'i-lucide-compass', order: 100 },
  { id: 'conversations', icon: 'i-lucide-messages-square', order: 200 },
  { id: 'contacts', icon: 'i-lucide-users', order: 300 },
  { id: 'channels', icon: 'i-lucide-inbox', order: 400 },
  { id: 'team', icon: 'i-lucide-shield-check', order: 500 },
  { id: 'productivity', icon: 'i-lucide-zap', order: 600 },
  { id: 'ai', icon: 'i-lucide-sparkles', order: 700 },
  { id: 'campaigns', icon: 'i-lucide-megaphone', order: 800 },
  { id: 'help-center', icon: 'i-lucide-book-open', order: 900 },
  { id: 'reports', icon: 'i-lucide-bar-chart-3', order: 1000 },
  { id: 'account', icon: 'i-lucide-settings', order: 1100 },
  { id: 'calls', icon: 'i-lucide-phone', order: 1200 },
];

export const categoryI18nKey = id => id.toUpperCase().replace(/-/g, '_');
