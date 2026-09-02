import { FEATURE_FLAGS } from 'dashboard/featureFlags';

// The create button is a plain toggle and the dialog closes itself on any
// outside click — the tour's own "Next" included, because `@vueuse/core`
// listens on `window` in the capture phase, ahead of driver.js. Probing the
// dialog keeps the toggle from re-opening a form the click already dismissed.
const CREATE_BUTTON = '[data-tour="campaigns-create"]';
const CAMPAIGN_DIALOG = '[data-tour="campaign-dialog"]';

export default {
  id: 'campaign-sms',
  category: 'campaigns',
  icon: 'i-lucide-smartphone',
  order: 820,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.CAMPAIGNS,
  // Verbatim from the `campaigns_sms_index` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 4,
  route: { name: 'campaigns_sms_index' },
  pageRoutes: ['campaigns_sms_index'],
  keywords: [
    'campana',
    'sms',
    'mensaje de texto',
    'twilio',
    'audiencia',
    'programar',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'CAMPAIGN_SMS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-campaigns-sms"]',
      i18nKey: 'CAMPAIGN_SMS.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'campaigns_sms_index' },
      before: { expandSidebarGroup: 'Campaigns' },
    },
    {
      target: '[data-tour="campaigns-page"]',
      i18nKey: 'CAMPAIGN_SMS.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: '[data-tour="campaigns-create"]',
      i18nKey: 'CAMPAIGN_SMS.CREATE',
      side: 'bottom',
      align: 'end',
    },
    // Same popover contract as the live-chat campaign: open on the way in,
    // close on the way out.
    {
      target: '[data-tour="campaign-dialog"]',
      i18nKey: 'CAMPAIGN_SMS.FORM',
      side: 'left',
      align: 'start',
      before: { click: CREATE_BUTTON, probe: CAMPAIGN_DIALOG },
      after: { click: CREATE_BUTTON, probe: CAMPAIGN_DIALOG },
    },
    {
      target: null,
      i18nKey: 'CAMPAIGN_SMS.AUDIENCE',
    },
    {
      target: null,
      i18nKey: 'CAMPAIGN_SMS.SCHEDULE',
    },
    {
      target: '[data-tour="campaigns-list"]',
      i18nKey: 'CAMPAIGN_SMS.STATUS',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'CAMPAIGN_SMS.FINISH',
    },
  ],
};
