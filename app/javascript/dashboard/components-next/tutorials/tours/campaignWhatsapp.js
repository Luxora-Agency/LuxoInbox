import { FEATURE_FLAGS } from 'dashboard/featureFlags';

// The create button is a plain toggle and the dialog closes itself on any
// outside click — the tour's own "Next" included, because `@vueuse/core`
// listens on `window` in the capture phase, ahead of driver.js. Probing the
// dialog keeps the toggle from re-opening a form the click already dismissed.
const CREATE_BUTTON = '[data-tour="campaigns-create"]';
const CAMPAIGN_DIALOG = '[data-tour="campaign-dialog"]';

export default {
  id: 'campaign-whatsapp',
  category: 'campaigns',
  icon: 'i-lucide-message-circle',
  order: 830,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.WHATSAPP_CAMPAIGNS,
  // Verbatim from the `campaigns_whatsapp_index` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 5,
  route: { name: 'campaigns_whatsapp_index' },
  pageRoutes: ['campaigns_whatsapp_index', 'campaigns_whatsapp_analytics'],
  keywords: [
    'campana',
    'whatsapp',
    'plantilla',
    'template',
    'difusion',
    'audiencia',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'CAMPAIGN_WHATSAPP.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-campaigns-whatsapp"]',
      i18nKey: 'CAMPAIGN_WHATSAPP.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'campaigns_whatsapp_index' },
      before: { expandSidebarGroup: 'Campaigns' },
    },
    {
      target: '[data-tour="campaigns-page"]',
      i18nKey: 'CAMPAIGN_WHATSAPP.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'CAMPAIGN_WHATSAPP.TEMPLATES',
    },
    {
      target: '[data-tour="campaigns-create"]',
      i18nKey: 'CAMPAIGN_WHATSAPP.CREATE',
      side: 'bottom',
      align: 'end',
    },
    // Same popover contract as the other campaign tours.
    {
      target: '[data-tour="campaign-dialog"]',
      i18nKey: 'CAMPAIGN_WHATSAPP.FORM',
      side: 'left',
      align: 'start',
      before: { click: CREATE_BUTTON, probe: CAMPAIGN_DIALOG },
      after: { click: CREATE_BUTTON, probe: CAMPAIGN_DIALOG },
    },
    {
      target: null,
      i18nKey: 'CAMPAIGN_WHATSAPP.VARIABLES',
    },
    {
      target: null,
      i18nKey: 'CAMPAIGN_WHATSAPP.AUDIENCE',
    },
    // The analytics screen needs a real campaign id in the URL, so it is
    // taught here instead of navigated to.
    {
      target: '[data-tour="campaigns-list"]',
      i18nKey: 'CAMPAIGN_WHATSAPP.ANALYTICS',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'CAMPAIGN_WHATSAPP.FINISH',
    },
  ],
};
