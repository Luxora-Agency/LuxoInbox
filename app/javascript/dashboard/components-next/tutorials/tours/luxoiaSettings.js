import { FEATURE_FLAGS } from 'dashboard/featureFlags';

// The settings sub-pages (system, audience, schedule, guardrails, guidelines)
// are vertical tabs of this same screen and each one needs `:assistantId` in
// the URL, so they are taught from here instead of being navigated to.
export default {
  id: 'luxoia-settings',
  category: 'ai',
  icon: 'i-lucide-sliders-horizontal',
  order: 760,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CAPTAIN,
  permissions: ['administrator', 'agent'],
  installationTypes: ['cloud', 'enterprise', 'community'],
  estimatedMinutes: 5,
  route: {
    name: 'captain_assistants_index',
    params: { navigationPath: 'captain_assistants_settings_index' },
  },
  pageRoutes: [
    'captain_assistants_settings_index',
    'captain_assistants_settings_system_index',
    'captain_assistants_settings_audience_index',
    'captain_assistants_settings_schedule_index',
    'captain_assistants_guardrails_index',
    'captain_assistants_guidelines_index',
  ],
  keywords: [
    'ajustes',
    'settings',
    'audiencia',
    'horario',
    'guardrails',
    'tono',
    'limites',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidebar-luxoia-settings"]',
      i18nKey: 'LUXOIA_SETTINGS.NAV',
      before: { expandSidebarGroup: 'LuxoIA' },
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="captain-settings"]',
      i18nKey: 'LUXOIA_SETTINGS.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_SETTINGS.SYSTEM',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_SETTINGS.AUDIENCE',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_SETTINGS.SCHEDULE',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_SETTINGS.GUARDRAILS',
      featureFlag: FEATURE_FLAGS.CAPTAIN_V2,
    },
    {
      target: null,
      i18nKey: 'LUXOIA_SETTINGS.GUIDELINES',
      featureFlag: FEATURE_FLAGS.CAPTAIN_V2,
    },
    {
      target: null,
      i18nKey: 'LUXOIA_SETTINGS.DELETE',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_SETTINGS.FINISH',
    },
  ],
};
