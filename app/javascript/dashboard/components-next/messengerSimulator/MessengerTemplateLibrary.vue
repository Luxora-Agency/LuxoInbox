<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  listMessengerTemplates,
  saveMessengerTemplate,
  deleteMessengerTemplate,
} from 'dashboard/api/messengerTemplates';
import Button from 'dashboard/components-next/button/Button.vue';
import ConfirmButton from 'dashboard/components-next/button/ConfirmButton.vue';
import Input from 'dashboard/components-next/input/Input.vue';
import MessengerSimulatorEditor from './MessengerSimulatorEditor.vue';

const props = defineProps({ accountId: { type: Number, required: true } });
const emit = defineEmits(['accessDenied']);
const { t } = useI18n();
const records = ref([]);
const selected = ref('manual');
const current = ref(null);
const title = ref('');
const editor = ref(null);
const revision = ref(0);
const baseline = ref('');
const busy = ref(false);
const error = ref('');
const saved = ref(false);
let active = true;
const dirty = computed(
  () =>
    baseline.value &&
    (editor.value?.getSnapshot() !== baseline.value ||
      title.value !== (current.value?.title || ''))
);
const run = async operation => {
  busy.value = true;
  error.value = '';
  saved.value = false;
  try {
    await operation();
  } catch (failure) {
    if (!active) return;
    if ([401, 403].includes(failure.response?.status)) emit('accessDenied');
    else error.value = t('MESSENGER_SIMULATOR.TEMPLATES.ERROR');
  } finally {
    if (active) busy.value = false;
  }
};
const open = async () => {
  current.value =
    selected.value === 'new'
      ? {
          title: '',
          definition: {
            version: 1,
            business_name: t('MESSENGER_SIMULATOR.EXAMPLE_OUTGOING_NAME'),
            avatar: 'contact',
            messages: [],
          },
        }
      : records.value.find(record => String(record.id) === selected.value) ||
        null;
  title.value = current.value?.title || '';
  revision.value += 1;
  await nextTick();
  baseline.value = editor.value?.getSnapshot();
};
const save = duplicate =>
  run(async () => {
    const definition = editor.value.getDefinition();
    if (!definition || !title.value.trim()) {
      error.value = t('MESSENGER_SIMULATOR.TEMPLATES.INVALID');
      return;
    }
    const { data } = await saveMessengerTemplate(
      props.accountId,
      duplicate ? null : current.value.id,
      {
        title: title.value.trim(),
        definition,
      }
    );
    if (!active) return;
    records.value = [
      ...records.value.filter(record => record.id !== data.id),
      data,
    ];
    current.value = data;
    title.value = data.title;
    selected.value = String(data.id);
    baseline.value = editor.value.getSnapshot();
    saved.value = true;
  });
const remove = () =>
  run(async () => {
    await deleteMessengerTemplate(props.accountId, current.value.id);
    if (!active) return;
    records.value = records.value.filter(
      record => record.id !== current.value.id
    );
    selected.value = 'manual';
    await open();
  });
onMounted(() => {
  baseline.value = editor.value.getSnapshot();
  run(async () => {
    const { data } = await listMessengerTemplates(props.accountId);
    if (!active) return;
    records.value = data;
  });
});
onBeforeUnmount(() => {
  active = false;
});
</script>

<template>
  <fieldset :disabled="busy" class="border-b border-n-weak px-5 py-4 lg:px-8">
    <div class="flex flex-wrap items-end gap-3">
      <label class="mb-0 flex min-w-0 flex-1 flex-col gap-1 text-sm">
        {{ t('MESSENGER_SIMULATOR.TEMPLATES.LIBRARY') }}
        <select
          v-model="selected"
          class="mb-0 w-full rounded-lg border border-n-weak bg-n-solid-1 text-sm"
        >
          <option value="manual">
            {{ t('MESSENGER_SIMULATOR.TEMPLATES.MANUAL') }}
          </option>
          <option value="new">
            {{ t('MESSENGER_SIMULATOR.TEMPLATES.NEW') }}
          </option>
          <option
            v-for="record in records"
            :key="record.id"
            :value="String(record.id)"
          >
            {{ record.title }}
          </option>
        </select>
      </label>
      <ConfirmButton
        v-if="dirty"
        :label="t('MESSENGER_SIMULATOR.TEMPLATES.OPEN')"
        :confirm-label="t('MESSENGER_SIMULATOR.TEMPLATES.DISCARD')"
        @click="open"
      />
      <Button
        v-else
        :label="t('MESSENGER_SIMULATOR.TEMPLATES.OPEN')"
        @click="open"
      />
    </div>
    <div v-if="current" class="mt-3 flex flex-wrap items-end gap-2">
      <Input
        v-model="title"
        :maxlength="100"
        :label="t('MESSENGER_SIMULATOR.TEMPLATES.TITLE')"
        class="min-w-0 flex-1"
      />
      <Button
        :label="t('MESSENGER_SIMULATOR.TEMPLATES.SAVE')"
        @click="save(false)"
      />
      <Button
        v-if="current.id"
        variant="ghost"
        :label="t('MESSENGER_SIMULATOR.TEMPLATES.DUPLICATE')"
        @click="save(true)"
      />
      <ConfirmButton
        v-if="current.id"
        color="ruby"
        variant="ghost"
        :label="t('MESSENGER_SIMULATOR.TEMPLATES.DELETE')"
        :confirm-label="t('MESSENGER_SIMULATOR.TEMPLATES.CONFIRM_DELETE')"
        @click="remove"
      />
    </div>
    <p v-if="busy" role="status" class="mb-0 mt-2 text-sm">
      {{ t('MESSENGER_SIMULATOR.LOADING') }}
    </p>
    <p v-if="error" role="alert" class="mb-0 mt-2 text-sm text-n-ruby-11">
      {{ error }}
    </p>
    <p v-else-if="saved" role="status" class="mb-0 mt-2 text-sm text-n-teal-11">
      {{ t('MESSENGER_SIMULATOR.TEMPLATES.SAVED') }}
    </p>
    <p v-else class="mb-0 mt-2 text-xs text-n-slate-11">
      {{ t('MESSENGER_SIMULATOR.TEMPLATES.HINT') }}
    </p>
  </fieldset>
  <MessengerSimulatorEditor
    ref="editor"
    :key="revision"
    :account-id="accountId"
    :initial-definition="current?.definition"
    :disabled="busy"
    @access-denied="emit('accessDenied')"
  />
</template>
