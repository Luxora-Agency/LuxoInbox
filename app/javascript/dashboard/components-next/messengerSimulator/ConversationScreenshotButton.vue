<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAccount } from 'dashboard/composables/useAccount';
import { useMapGetter } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import { FEATURE_FLAGS } from 'dashboard/featureFlags';
import { getConversationScreenshot } from 'dashboard/api/messengerSimulator';
import Button from 'dashboard/components-next/button/Button.vue';
import MessengerScreenshotRenderer from './MessengerScreenshotRenderer.vue';
import { loadConversationScreenshot } from './conversationScreenshot';

const props = defineProps({ conversationId: { type: Number, required: true } });
const { t } = useI18n();
const { accountId } = useAccount();
const isFeatureEnabled = useMapGetter('accounts/isFeatureEnabledonAccount');
const enabled = computed(() =>
  isFeatureEnabled.value(accountId.value, FEATURE_FLAGS.MESSENGER_SIMULATOR)
);
const rendererRef = ref(null);
const busy = ref(false);
let version = 0;
let active = true;
watch(
  [accountId, () => props.conversationId, enabled],
  () => {
    version += 1;
    busy.value = false;
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
onBeforeUnmount(() => {
  active = false;
  version += 1;
});
</script>

<template>
  <Button
    v-if="enabled"
    v-tooltip="t('MESSENGER_SIMULATOR.CONVERSATION_TOOLTIP')"
    variant="ghost"
    color="slate"
    size="sm"
    icon="i-lucide-image-down"
    :aria-label="
      busy
        ? t('MESSENGER_SIMULATOR.EXPORTING')
        : t('MESSENGER_SIMULATOR.CONVERSATION_EXPORT')
    "
    :disabled="busy"
    :is-loading="busy"
    @click="download"
  />
  <span v-if="busy" class="sr-only" role="status">{{
    t('MESSENGER_SIMULATOR.EXPORTING')
  }}</span>
  <MessengerScreenshotRenderer
    v-if="enabled"
    :key="`${accountId}-${conversationId}`"
    ref="rendererRef"
  />
</template>
