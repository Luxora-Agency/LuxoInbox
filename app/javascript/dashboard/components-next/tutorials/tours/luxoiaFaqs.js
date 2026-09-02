import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'luxoia-faqs',
  category: 'ai',
  icon: 'i-lucide-message-square-quote',
  order: 710,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CAPTAIN,
  permissions: ['administrator', 'agent'],
  installationTypes: ['cloud', 'enterprise', 'community'],
  estimatedMinutes: 4,
  route: {
    name: 'captain_assistants_index',
    params: { navigationPath: 'captain_assistants_responses_index' },
  },
  // The suggestion queue is a second screen of the same feature, so the chip
  // and the per-screen launcher offer this tour there too.
  pageRoutes: [
    'captain_assistants_responses_index',
    'captain_assistants_faq_suggestions',
  ],
  keywords: [
    'faq',
    'preguntas frecuentes',
    'respuestas',
    'conocimiento',
    'knowledge',
    'sugerencias',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidebar-luxoia-faqs"]',
      i18nKey: 'LUXOIA_FAQS.NAV',
      before: { expandSidebarGroup: 'LuxoIA' },
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="captain-responses"]',
      i18nKey: 'LUXOIA_FAQS.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_FAQS.CREATE',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_FAQS.SEARCH',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_FAQS.SUGGESTIONS',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_FAQS.APPROVE',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_FAQS.QUALITY',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_FAQS.FINISH',
    },
  ],
};
