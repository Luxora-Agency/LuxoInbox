import { FEATURE_FLAGS } from '../../../../featureFlags';
import { frontendURL } from '../../../../helper/URLHelper';
import SettingsWrapper from '../SettingsWrapper.vue';
import Index from './Index.vue';
import Editor from './Editor.vue';

const meta = {
  featureFlag: FEATURE_FLAGS.MESSENGER_SIMULATOR,
  permissions: ['administrator'],
};

export default {
  routes: [
    {
      path: frontendURL('accounts/:accountId/settings/messenger-templates'),
      component: SettingsWrapper,
      // The editor must reload its record and reset its draft on every visit; a cached
      // instance would hand the previous template back to "New template".
      props: { keepAlive: false },
      children: [
        {
          path: '',
          redirect: to => {
            return { name: 'messenger_templates_list', params: to.params };
          },
        },
        {
          path: 'list',
          name: 'messenger_templates_list',
          meta,
          component: Index,
        },
        {
          path: 'new',
          name: 'messenger_templates_new',
          meta,
          component: Editor,
        },
        {
          path: ':templateId/edit',
          name: 'messenger_templates_edit',
          meta,
          component: Editor,
        },
      ],
    },
  ],
};
