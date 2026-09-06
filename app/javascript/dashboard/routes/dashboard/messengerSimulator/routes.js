import { FEATURE_FLAGS } from 'dashboard/featureFlags';
import { frontendURL } from 'dashboard/helper/URLHelper';

export const routes = [
  {
    path: frontendURL('accounts/:accountId/messenger-simulator'),
    name: 'messenger_simulator',
    component: () => import('./MessengerSimulatorPage.vue'),
    meta: {
      permissions: ['administrator', 'agent', 'custom_role'],
      featureFlag: FEATURE_FLAGS.MESSENGER_SIMULATOR,
    },
  },
];
