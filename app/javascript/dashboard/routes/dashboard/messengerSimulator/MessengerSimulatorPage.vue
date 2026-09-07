<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventListener } from '@vueuse/core';
import { useAccount } from 'dashboard/composables/useAccount';
import { useMapGetter } from 'dashboard/composables/store';
import { FEATURE_FLAGS } from 'dashboard/featureFlags';
import { authorizeMessengerSimulator } from 'dashboard/api/messengerSimulator';
import { useAlert } from 'dashboard/composables';
import SessionStorage from 'shared/helpers/sessionStorage';
import Button from 'dashboard/components-next/button/Button.vue';
import MessengerSimulatorEditor from 'dashboard/components-next/messengerSimulator/MessengerSimulatorEditor.vue';
import MessengerTemplatePicker from 'dashboard/components-next/messengerSimulator/MessengerTemplatePicker.vue';

const { t } = useI18n();
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
// A recheck must confirm a revocation twice before the editor is torn down.
let revokedStreak = 0;

const editorRef = ref(null);
const current = ref(null);
const selection = ref('manual');
const revision = ref(0);
const baseline = ref('');
const restorableDraft = ref(null);

const editorKey = computed(() => `${accountId.value}-${revision.value}`);
const draftKey = computed(() => `messengerSimulatorDraft-${accountId.value}`);
const dirty = computed(
  () =>
    Boolean(baseline.value) && editorRef.value?.getSnapshot() !== baseline.value
);

const clearDraft = () => SessionStorage.remove(draftKey.value);

const readDraft = () => {
  const draft = SessionStorage.get(draftKey.value);
  restorableDraft.value = Array.isArray(draft?.definition?.messages)
    ? draft
    : null;
};

const definitionFromSnapshot = snapshot => {
  const { participants, messages, avatar } = JSON.parse(snapshot);
  return {
    version: 1,
    business_name: participants.outgoing.name,
    avatar,
    messages: messages.map(({ sender, text, time }) => ({
      sender,
      text,
      time,
    })),
  };
};

const checkAccess = async () => {
  requestVersion += 1;
  const version = requestVersion;
  const requestedAccount = accountId.value;
  const isStale = () =>
    version !== requestVersion || requestedAccount !== accountId.value;
  try {
    await authorizeMessengerSimulator(requestedAccount);
    if (isStale()) return;
    access.value = 'allowed';
    accessWarning.value = false;
    revokedStreak = 0;
  } catch (error) {
    if (isStale()) return;
    const status = error.response?.status;
    const revoked = [401, 403].includes(status);
    revokedStreak = revoked ? revokedStreak + 1 : 0;
    if (access.value !== 'allowed') {
      // Nothing is on screen yet, so fail closed on the very first check.
      access.value = [401, 403, 404].includes(status) ? 'denied' : 'error';
      return;
    }
    // A transient 4xx on the focus recheck must never destroy a draft; every
    // export authorizes against the server again before delivering a file.
    if (revoked && revokedStreak >= 2) {
      access.value = 'denied';
      return;
    }
    accessWarning.value = true;
  }
};

const denyAccess = () => {
  requestVersion += 1;
  revokedStreak = 2;
  access.value = 'denied';
};

const loadTemplate = record => {
  current.value = record
    ? { id: record.id, definition: record.definition }
    : null;
  restorableDraft.value = null;
  clearDraft();
  revision.value += 1;
  if (record) useAlert(t('MESSENGER_TEMPLATES.SIMULATOR.LOADED'));
};

const restoreDraft = () => {
  const draft = restorableDraft.value;
  if (!draft) return;
  current.value = { id: draft.templateId, definition: draft.definition };
  selection.value = draft.templateId ? String(draft.templateId) : 'manual';
  restorableDraft.value = null;
  revision.value += 1;
  useAlert(t('MESSENGER_TEMPLATES.SIMULATOR.DRAFT_RESTORED'));
};

const discardDraft = () => {
  restorableDraft.value = null;
  clearDraft();
};

watch(
  accountId,
  () => {
    access.value = 'checking';
    accessWarning.value = false;
    revokedStreak = 0;
    current.value = null;
    selection.value = 'manual';
    baseline.value = '';
    revision.value += 1;
    readDraft();
    checkAccess();
  },
  { immediate: true, flush: 'sync' }
);
watch(featureEnabled, (enabled, previouslyEnabled) => {
  if (previouslyEnabled && !enabled) denyAccess();
});
watch(editorRef, async instance => {
  baseline.value = '';
  if (!instance) return;
  await nextTick();
  baseline.value = instance.getSnapshot();
});
// Persist the working copy so a remount — an account switch, a revoked
// session, a reload — can offer it back instead of silently dropping it.
watch(
  () => editorRef.value?.getSnapshot(),
  snapshot => {
    if (!snapshot || !baseline.value || !current.value) return;
    if (snapshot === baseline.value) {
      clearDraft();
      return;
    }
    SessionStorage.set(draftKey.value, {
      templateId: current.value.id ?? null,
      definition: definitionFromSnapshot(snapshot),
    });
  }
);
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
    <template v-else-if="access === 'allowed'">
      <MessengerTemplatePicker
        v-model:selection="selection"
        :account-id="accountId"
        :dirty="dirty"
        @load="loadTemplate"
      />
      <div
        v-if="restorableDraft"
        role="status"
        class="flex flex-wrap items-center gap-3 border-b border-n-weak bg-n-amber-3 px-5 py-3 lg:px-8"
      >
        <p class="mb-0 min-w-0 flex-1 text-sm text-n-amber-12">
          {{ t('MESSENGER_TEMPLATES.SIMULATOR.DRAFT_AVAILABLE') }}
        </p>
        <Button
          size="sm"
          :label="t('MESSENGER_TEMPLATES.SIMULATOR.RESTORE_DRAFT')"
          @click="restoreDraft"
        />
        <Button
          size="sm"
          variant="ghost"
          color="slate"
          :label="t('MESSENGER_TEMPLATES.SIMULATOR.DISCARD_SAVED_DRAFT')"
          @click="discardDraft"
        />
      </div>
      <MessengerSimulatorEditor
        ref="editorRef"
        :key="editorKey"
        :account-id="accountId"
        :initial-definition="current?.definition"
        @access-denied="denyAccess"
      />
    </template>
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
