// The profile dropdown closes itself on any outside click, and the tour's own
// "Next" is one: `@vueuse/core` listens on `window` in the capture phase, which
// runs before driver.js can stop the event at `document`. Probing the menu
// before every open and close keeps the toggle from being flipped the wrong
// way and from leaving the dropdown orphaned over the sidebar.
const PROFILE_TRIGGER = '[data-tour="sidebar-profile"]';
const PROFILE_MENU = '[data-tour="profile-menu-availability"]';

// `before` skips the click when the menu is already open; `after` skips it when
// the menu is already gone.
const profileMenuToggle = { click: PROFILE_TRIGGER, probe: PROFILE_MENU };

export default {
  id: 'profile-and-preferences',
  category: 'start',
  icon: 'i-lucide-user-pen',
  order: 130,
  audience: 'all',
  featureFlag: null,
  // Verbatim from the `profile_settings_index` route meta.
  permissions: ['administrator', 'agent', 'custom_role'],
  estimatedMinutes: 4,
  route: { name: 'profile_settings_index' },
  pageRoutes: ['profile_settings_index', 'profile_settings_mfa'],
  keywords: [
    'perfil',
    'profile',
    'firma',
    'disponibilidad',
    'idioma',
    'apariencia',
    'tema',
    'mfa',
    'seguridad',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="profile-form"]',
      i18nKey: 'PROFILE_AND_PREFERENCES.PROFILE',
      side: 'right',
      align: 'start',
      route: { name: 'profile_settings_index' },
    },
    {
      target: null,
      i18nKey: 'PROFILE_AND_PREFERENCES.INTERFACE',
    },
    {
      target: null,
      i18nKey: 'PROFILE_AND_PREFERENCES.SIGNATURE',
    },
    {
      target: null,
      i18nKey: 'PROFILE_AND_PREFERENCES.SEND_KEY',
    },
    {
      target: null,
      i18nKey: 'PROFILE_AND_PREFERENCES.NOTIFICATIONS',
    },
    {
      target: '[data-tour="profile-menu-availability"]',
      i18nKey: 'PROFILE_AND_PREFERENCES.AVAILABILITY',
      side: 'right',
      align: 'end',
      before: profileMenuToggle,
      after: profileMenuToggle,
    },
    {
      target: '[data-tour="profile-menu-auto-offline"]',
      i18nKey: 'PROFILE_AND_PREFERENCES.AUTO_OFFLINE',
      side: 'right',
      align: 'end',
      before: profileMenuToggle,
      after: profileMenuToggle,
    },
    {
      target: '[data-tour="profile-menu-appearance"]',
      i18nKey: 'PROFILE_AND_PREFERENCES.APPEARANCE',
      side: 'right',
      align: 'end',
      before: profileMenuToggle,
      after: profileMenuToggle,
    },
    {
      // Two anchors, because the page renders the status card while MFA is off
      // and the management actions once it is on. The route redirects back to
      // the profile form when the installation has MFA turned off, and the step
      // is then dropped because neither anchor resolves.
      target: '[data-tour="mfa-status"], [data-tour="mfa-actions"]',
      i18nKey: 'PROFILE_AND_PREFERENCES.MFA',
      side: 'bottom',
      align: 'start',
      route: { name: 'profile_settings_mfa' },
    },
    {
      // Back to where the tour started: the MFA page is a dead end and the
      // step before it is dropped whenever MFA is already on.
      target: null,
      i18nKey: 'PROFILE_AND_PREFERENCES.FINISH',
      route: { name: 'profile_settings_index' },
    },
  ],
};
