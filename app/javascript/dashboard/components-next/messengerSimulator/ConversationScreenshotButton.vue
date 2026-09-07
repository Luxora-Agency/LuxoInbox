<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAccount } from 'dashboard/composables/useAccount';
import { useMapGetter, useStore } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import { FEATURE_FLAGS } from 'dashboard/featureFlags';
import {
  authorizeMessengerTemplateContext,
  getConversationScreenshot,
  getMessengerTemplateContext,
} from 'dashboard/api/messengerSimulator';
import Button from 'dashboard/components-next/button/Button.vue';
import DropdownMenu from 'dashboard/components-next/dropdown-menu/DropdownMenu.vue';
import MessengerScreenshotRenderer from './MessengerScreenshotRenderer.vue';
import { loadConversationScreenshot } from './conversationScreenshot';
import {
  buildAgentContext,
  resolveMessengerTemplate,
} from './templateDefinition';

const props = defineProps({ conversationId: { type: Number, required: true } });
const { t } = useI18n();
const { accountId } = useAccount();
const store = useStore();
const isFeatureEnabled = useMapGetter('accounts/isFeatureEnabledonAccount');
const enabled = computed(() =>
  isFeatureEnabled.value(accountId.value, FEATURE_FLAGS.MESSENGER_SIMULATOR)
);
const rendererRef = ref(null);
const busy = ref(false);
let version = 0;
let active = true;
const showMenu = ref(false);
const menuView = ref('actions');
const templatesRequested = ref(false);
const preparing = ref(false);
const storedTemplates = useMapGetter('messengerTemplates/getTemplates');
const currentUser = useMapGetter('getCurrentUser');
const selectedChat = useMapGetter('getSelectedChat');
const templates = computed(() =>
  Array.isArray(storedTemplates.value) ? storedTemplates.value : []
);
watch(
  [accountId, () => props.conversationId, enabled],
  () => {
    version += 1;
    busy.value = false;
    preparing.value = false;
    showMenu.value = false;
    menuView.value = 'actions';
    templatesRequested.value = false;
  },
  { flush: 'sync' }
);

const download = async () => {
  if (busy.value || !enabled.value) return;
  busy.value = true;
  version += 1;
  const operation = version;
  const requestedAccount = accountId.value;
  const requestedConversation = props.conversationId;
  const isCurrent = () => active && version === operation && enabled.value;
  try {
    const content = await loadConversationScreenshot({
      accountId: requestedAccount,
      conversationId: requestedConversation,
      isCurrent,
      t,
    });
    if (!isCurrent()) return;
    const count = await rendererRef.value.download({
      ...content,
      isCurrent,
      authorize: () =>
        getConversationScreenshot(requestedAccount, requestedConversation, {
          authorize_only: true,
        }),
      filename: `messenger-conversation-${requestedAccount}-${requestedConversation}`,
    });
    if (isCurrent())
      useAlert(
        count > 1
          ? t('MESSENGER_SIMULATOR.EXPORT_SUCCESS_PARTS', { count })
          : t('MESSENGER_SIMULATOR.CONVERSATION_SUCCESS')
      );
  } catch (error) {
    if (!isCurrent()) return;
    if ([401, 403, 404].includes(error.response?.status)) {
      useAlert(t('MESSENGER_SIMULATOR.CONVERSATION_UNAVAILABLE'));
    } else if (error.message === 'empty') {
      useAlert(t('MESSENGER_SIMULATOR.CONVERSATION_EMPTY'));
    } else if (error.message === 'limit') {
      useAlert(t('MESSENGER_SIMULATOR.EXPORT_LIMIT'));
    } else {
      useAlert(t('MESSENGER_SIMULATOR.EXPORT_ERROR'));
    }
  } finally {
    if (isCurrent()) busy.value = false;
  }
};

// The same builder the editor preview uses, so `{{agent.name}}` reads identically in
// both places and nothing but the four catalog fields reaches the screenshot.
const agentContext = computed(() => {
  const chat = selectedChat.value;
  const assignee =
    chat && chat.id === props.conversationId ? chat.meta?.assignee : null;
  return buildAgentContext(assignee || currentUser.value);
});

const downloadFromTemplate = async template => {
  if (busy.value || !enabled.value) return;
  busy.value = true;
  version += 1;
  const operation = version;
  const requestedAccount = accountId.value;
  const requestedConversation = props.conversationId;
  const isCurrent = () => active && version === operation && enabled.value;
  try {
    const { data } = await getMessengerTemplateContext(
      requestedAccount,
      requestedConversation,
      { template_id: template.id }
    );
    if (!isCurrent()) return;
    // The server copy is the one the context token was digested from.
    const content = resolveMessengerTemplate(data.template.definition, {
      contact: data.contact,
      agent: agentContext.value,
    });
    const count = await rendererRef.value.download({
      participants: content.participants,
      messages: content.messages.map(message => ({ ...message })),
      isCurrent,
      authorize: () =>
        authorizeMessengerTemplateContext(
          requestedAccount,
          requestedConversation,
          {
            template_id: template.id,
            context_token: data.context_token,
          }
        ),
      filename: `messenger-template-${requestedAccount}-${requestedConversation}`,
    });
    if (isCurrent())
      useAlert(
        count > 1
          ? t('MESSENGER_SIMULATOR.EXPORT_SUCCESS_PARTS', { count })
          : t('MESSENGER_TEMPLATES.CONVERSATION_EXPORT.SUCCESS')
      );
  } catch (error) {
    if (!isCurrent()) return;
    if (error.response?.status === 409) {
      useAlert(t('MESSENGER_TEMPLATES.CONVERSATION_EXPORT.CONTACT_CHANGED'));
    } else if ([401, 403, 404].includes(error.response?.status)) {
      useAlert(t('MESSENGER_SIMULATOR.CONVERSATION_UNAVAILABLE'));
    } else if (error.message === 'empty') {
      useAlert(t('MESSENGER_SIMULATOR.CONVERSATION_EMPTY'));
    } else if (error.message === 'limit') {
      useAlert(t('MESSENGER_SIMULATOR.EXPORT_LIMIT'));
    } else {
      useAlert(t('MESSENGER_TEMPLATES.CONVERSATION_EXPORT.ERROR'));
    }
  } finally {
    if (isCurrent()) busy.value = false;
  }
};

const loadTemplates = async () => {
  if (templatesRequested.value) return;
  templatesRequested.value = true;
  try {
    await store.dispatch('messengerTemplates/get');
  } catch {
    // No library, so the click falls through to the real-history export, and the
    // next click retries the fetch.
    templatesRequested.value = false;
  }
};

const closeMenu = () => {
  showMenu.value = false;
  menuView.value = 'actions';
};

// Switching to the template list removes the button that had focus, so focus falls back
// to the body and a wrapper-scoped handler never sees the key. The listener lives on the
// document for exactly as long as the menu is open.
const onEscape = event => {
  if (event.key === 'Escape') closeMenu();
};

// Outside clicks are detected on pointerdown, before any handler mutates the DOM. A click-based
// check runs after the menu re-renders for the chosen view, so the item just pressed is already
// detached, no longer counts as inside, and a real click closed the menu instead of opening the
// template list.
const wrapperRef = ref(null);
const onPointerDown = event => {
  if (!wrapperRef.value?.contains(event.target)) closeMenu();
};

watch(showMenu, open => {
  if (open) {
    document.addEventListener('keydown', onEscape);
    document.addEventListener('pointerdown', onPointerDown);
  } else {
    document.removeEventListener('keydown', onEscape);
    document.removeEventListener('pointerdown', onPointerDown);
  }
});

// The library is fetched before the menu opens: an account with no templates keeps the
// one-click real-history export, and the template entry never pops in under the cursor.
const toggleMenu = async () => {
  if (showMenu.value) {
    closeMenu();
    return;
  }
  preparing.value = true;
  await loadTemplates();
  preparing.value = false;
  if (!templates.value.length) {
    download();
    return;
  }
  showMenu.value = true;
  menuView.value = 'actions';
};

const actionItems = computed(() => [
  {
    label: t('MESSENGER_TEMPLATES.CONVERSATION_EXPORT.REAL_HISTORY'),
    action: 'history',
    value: 'history',
    icon: 'i-lucide-history',
  },
  {
    label: t('MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'),
    action: 'template',
    value: 'template',
    icon: 'i-lucide-layout-template',
  },
]);

// The store lists the account default first; the badge marks it in its own element, so a
// long title truncates without taking the mark down with it.
const templateItems = computed(() =>
  templates.value.map(template => ({
    label: template.title,
    isDefault: Boolean(template.is_default),
    action: 'pick',
    value: template.id,
    icon: 'i-lucide-image',
  }))
);

const menuItems = computed(() =>
  menuView.value === 'templates' ? templateItems.value : actionItems.value
);

const handleAction = ({ action, value }) => {
  if (action === 'history') {
    closeMenu();
    download();
  } else if (action === 'template') {
    menuView.value = 'templates';
  } else if (action === 'pick') {
    const template = templates.value.find(record => record.id === value);
    closeMenu();
    if (template) downloadFromTemplate(template);
  }
};

onBeforeUnmount(() => {
  active = false;
  version += 1;
  document.removeEventListener('keydown', onEscape);
  document.removeEventListener('pointerdown', onPointerDown);
});
</script>

<!-- eslint-disable-next-line vue/no-root-v-if -->
<template>
  <div v-if="enabled" ref="wrapperRef" class="relative flex items-center">
    <Button
      v-tooltip="t('MESSENGER_SIMULATOR.CONVERSATION_TOOLTIP')"
      variant="ghost"
      color="slate"
      size="sm"
      icon="i-lucide-image-down"
      aria-haspopup="menu"
      :aria-expanded="showMenu"
      :aria-label="
        busy
          ? t('MESSENGER_SIMULATOR.EXPORTING')
          : t('MESSENGER_TEMPLATES.CONVERSATION_EXPORT.MENU_LABEL')
      "
      :class="showMenu ? 'bg-n-alpha-2' : ''"
      :disabled="busy || preparing"
      :is-loading="busy || preparing"
      @click="toggleMenu"
    />
    <span v-if="busy" class="sr-only" role="status">
      {{ t('MESSENGER_SIMULATOR.EXPORTING') }}
    </span>
    <DropdownMenu
      v-if="showMenu"
      :key="menuView"
      :menu-items="menuItems"
      :show-search="menuView === 'templates'"
      :search-placeholder="t('MESSENGER_TEMPLATES.CONVERSATION_EXPORT.SEARCH')"
      empty-state-message="MESSENGER_TEMPLATES.CONVERSATION_EXPORT.EMPTY"
      class="top-full mt-1 w-64 ltr:right-0 rtl:left-0"
      @action="handleAction($event)"
    >
      <template #trailing-icon="{ item }">
        <span
          v-if="item.isDefault"
          class="ms-auto flex-shrink-0 rounded-md bg-orbis-navy px-1.5 py-0.5 text-xs font-medium text-orbis-neon ring-1 ring-orbis-neon/25 dark:ring-orbis-neon/40"
        >
          {{ t('MESSENGER_TEMPLATES.DEFAULT.BADGE') }}
        </span>
      </template>
      <template v-if="menuView === 'templates'" #footer>
        <div class="border-t border-n-weak px-2 py-2">
          <button
            type="button"
            class="inline-flex h-8 w-full items-center justify-start gap-2 rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm font-420 text-n-slate-11 hover:bg-n-alpha-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:hover:bg-n-alpha-2 dark:focus-visible:ring-orbis-neon"
            @click="menuView = 'actions'"
          >
            <span class="i-lucide-arrow-left size-3.5 flex-shrink-0" />
            {{ t('MESSENGER_TEMPLATES.CONVERSATION_EXPORT.BACK') }}
          </button>
        </div>
      </template>
    </DropdownMenu>
    <MessengerScreenshotRenderer
      :key="`${accountId}-${conversationId}`"
      ref="rendererRef"
    />
  </div>
</template>
