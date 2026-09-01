import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'campaigns',
  icon: 'i-lucide-megaphone',
  order: 8,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.CAMPAIGNS,
  estimatedMinutes: 4,
  route: { name: 'campaigns_livechat_index' },
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'CAMPAIGNS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-campaigns"]',
      i18nKey: 'CAMPAIGNS.NAVIGATION',
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="campaigns-page"]',
      i18nKey: 'CAMPAIGNS.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: '[data-tour="sidebar-campaigns-live-chat"]',
      i18nKey: 'CAMPAIGNS.LIVE_CHAT',
      side: 'right',
      align: 'start',
      route: { name: 'campaigns_livechat_index' },
    },
    {
      target: null,
      i18nKey: 'CAMPAIGNS.LIVE_CHAT_SETUP',
    },
    {
      target: '[data-tour="sidebar-campaigns-sms"]',
      i18nKey: 'CAMPAIGNS.SMS',
      side: 'right',
      align: 'start',
      route: { name: 'campaigns_sms_index' },
    },
    {
      target: '[data-tour="sidebar-campaigns-whatsapp"]',
      i18nKey: 'CAMPAIGNS.WHATSAPP',
      side: 'right',
      align: 'start',
      route: { name: 'campaigns_whatsapp_index' },
      featureFlag: FEATURE_FLAGS.WHATSAPP_CAMPAIGNS,
    },
    {
      target: '[data-tour="campaigns-page"]',
      i18nKey: 'CAMPAIGNS.AUDIENCE',
      side: 'top',
      align: 'center',
      route: { name: 'campaigns_sms_index' },
    },
    {
      target: null,
      i18nKey: 'CAMPAIGNS.METRICS',
    },
    {
      target: null,
      i18nKey: 'CAMPAIGNS.FINISH',
    },
  ],
};
