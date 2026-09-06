<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventListener } from '@vueuse/core';
import { useAdmin } from 'dashboard/composables/useAdmin';
import MessengerTemplateLibrary from 'dashboard/components-next/messengerSimulator/MessengerTemplateLibrary.vue';
import { useAccount } from 'dashboard/composables/useAccount';
import { useMapGetter } from 'dashboard/composables/store';
import { FEATURE_FLAGS } from 'dashboard/featureFlags';
import { authorizeMessengerSimulator } from 'dashboard/api/messengerSimulator';
import Button from 'dashboard/components-next/button/Button.vue';
import MessengerSimulatorEditor from 'dashboard/components-next/messengerSimulator/MessengerSimulatorEditor.vue';

const { t } = useI18n();
const { isAdmin } = useAdmin();
const { accountId } = useAccount();
const isFeatureEnabled = useMapGetter('accounts/isFeatureEnabledonAccount');
const featureEnabled = computed(() =>
  isFeatureEnabled.value(accountId.value, FEATURE_FLAGS.MESSENGER_SIMULATOR)
);
const access = ref('checking');
const accessWarning = ref(false);
const unavailableMessage = computed(() =>
  access.value === 'denied'
    ? t('MESSENGER_SIMULATOR.UNAVAILABLE')
    : t('MESSENGER_SIMULATOR.CHECK_ERROR')
);
let requestVersion = 0;

const checkAccess = async () => {
  requestVersion += 1;
  const version = requestVersion;
  const requestedAccount = accountId.value;
  try {
    await authorizeMessengerSimulator(requestedAccount);
    if (version === requestVersion && requestedAccount === accountId.value) {
      access.value = 'allowed';
      accessWarning.value = false;
    }
  } catch (error) {
    if (version === requestVersion && requestedAccount === accountId.value) {
      if ([401, 403, 404].includes(error.response?.status)) {
        access.value = 'denied';
      } else if (access.value !== 'allowed') {
        // A transient focus-check failure must not erase an existing local draft.
        // Export always performs its own server authorization.
        access.value = 'error';
      } else {
        accessWarning.value = true;
      }
    }
  }
};

const denyAccess = () => {
  requestVersion += 1;
  access.value = 'denied';
};

watch(
  accountId,
  () => {
    access.value = 'checking';
    accessWarning.value = false;
    checkAccess();
  },
  { immediate: true, flush: 'sync' }
);
watch(featureEnabled, (enabled, previouslyEnabled) => {
  if (previouslyEnabled && !enabled) denyAccess();
});
useEventListener(window, 'focus', checkAccess);
onBeforeUnmount(() => {
  requestVersion += 1;
});
</script>

<template>
  <section
    class="flex h-full w-full min-w-0 flex-col overflow-y-auto bg-n-background text-n-slate-12"
  >
    <header class="border-b border-n-weak px-5 py-6 lg:px-8">
      <h1 class="mb-2 text-2xl font-semibold">
        {{ t('MESSENGER_SIMULATOR.TITLE') }}
      </h1>
      <p class="mb-0 max-w-prose text-sm text-n-slate-11">
        {{ t('MESSENGER_SIMULATOR.DESCRIPTION') }}
      </p>
    </header>
    <p
      v-if="accessWarning && access === 'allowed'"
      role="status"
      class="mb-0 px-5 pt-4 text-sm text-n-amber-11 lg:px-8"
    >
      {{ t('MESSENGER_SIMULATOR.ACCESS_WARNING') }}
    </p>
    <div
      v-if="access === 'checking'"
      role="status"
      class="space-y-4 p-8"
      :aria-label="t('MESSENGER_SIMULATOR.LOADING')"
    >
      <div class="h-8 w-48 rounded-lg bg-n-alpha-2" />
      <div class="h-64 max-w-2xl rounded-xl bg-n-alpha-2" />
      <p class="text-sm text-n-slate-11">
        {{ t('MESSENGER_SIMULATOR.LOADING') }}
      </p>
    </div>
    <component
      :is="isAdmin ? MessengerTemplateLibrary : MessengerSimulatorEditor"
      v-else-if="access === 'allowed'"
      :key="accountId"
      :account-id="accountId"
      @access-denied="denyAccess"
    />
    <div v-else class="mx-auto max-w-lg px-6 py-16 text-center">
      <h2 class="text-lg font-semibold">
        {{ t('MESSENGER_SIMULATOR.UNAVAILABLE_TITLE') }}
      </h2>
      <p role="alert" class="mt-3 text-sm text-n-slate-11">
        {{ unavailableMessage }}
      </p>
      <Button
        class="mt-4"
        variant="outline"
        color="slate"
        :label="t('MESSENGER_SIMULATOR.RETRY')"
        @click="checkAccess"
      />
    </div>
  </section>
</template>
