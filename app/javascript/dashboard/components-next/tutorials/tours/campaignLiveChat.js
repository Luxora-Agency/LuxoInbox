import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'campaign-live-chat',
  category: 'campaigns',
  icon: 'i-lucide-message-square-plus',
  order: 810,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.CAMPAIGNS,
  // Verbatim from the `campaigns_livechat_index` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 4,
  route: { name: 'campaigns_livechat_index' },
  pageRoutes: ['campaigns_livechat_index'],
  keywords: [
    'campana',
    'live chat',
    'chat en vivo',
    'mensaje proactivo',
    'widget',
    'visitante',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'CAMPAIGN_LIVE_CHAT.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-campaigns-live-chat"]',
      i18nKey: 'CAMPAIGN_LIVE_CHAT.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'campaigns_livechat_index' },
      before: { expandSidebarGroup: 'Campaigns' },
    },
    {
      target: '[data-tour="campaigns-page"]',
      i18nKey: 'CAMPAIGN_LIVE_CHAT.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: '[data-tour="campaigns-create"]',
      i18nKey: 'CAMPAIGN_LIVE_CHAT.CREATE',
      side: 'bottom',
      align: 'end',
    },
    // The form lives in a popover that only exists while the create button is
    // toggled on, so the step opens it on the way in and closes it on the way
    // out. Everything else about the form is taught without an anchor.
    {
      target: '[data-tour="campaign-dialog"]',
      i18nKey: 'CAMPAIGN_LIVE_CHAT.FORM',
      side: 'left',
      align: 'start',
      before: { click: '[data-tour="campaigns-create"]' },
      after: { click: '[data-tour="campaigns-create"]' },
    },
    {
      target: null,
      i18nKey: 'CAMPAIGN_LIVE_CHAT.TRIGGER',
    },
    {
      target: null,
      i18nKey: 'CAMPAIGN_LIVE_CHAT.SENDER',
    },
    {
      target: '[data-tour="campaigns-list"]',
      i18nKey: 'CAMPAIGN_LIVE_CHAT.LIST',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'CAMPAIGN_LIVE_CHAT.FINISH',
    },
  ],
};
