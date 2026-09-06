<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  listMessengerTemplates,
  getMessengerTemplateContext,
} from 'dashboard/api/messengerTemplates';
import Dialog from 'dashboard/components-next/dialog/Dialog.vue';
import Input from 'dashboard/components-next/input/Input.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import MessengerSimulatorPreview from './MessengerSimulatorPreview.vue';
import MessengerScreenshotRenderer from './MessengerScreenshotRenderer.vue';
import { resolveMessengerTemplate } from './templateDefinition';

const props = defineProps({
  accountId: { type: Number, required: true },
  conversationId: { type: Number, required: true },
  isCurrent: { type: Function, required: true },
});
const emit = defineEmits(['close']);
const { t } = useI18n();
const dialog = ref(null);
const renderer = ref(null);
const records = ref([]);
const selected = ref('');
const context = ref(null);
const contact = ref({});
const requestedFields = ref([]);
const busy = ref(false);
const error = ref('');
let version = 0;
let active = true;
const labels = computed(() => ({
  name: t('MESSENGER_SIMULATOR.TEMPLATES.VARIABLE_NAME'),
  phone: t('MESSENGER_SIMULATOR.TEMPLATES.VARIABLE_PHONE'),
}));
const fields = computed(() =>
  context.value &&
  JSON.stringify(context.value.template.definition).includes(
    '{{contact.phone}}'
  )
    ? ['name', 'phone']
    : ['name']
);
const ready = computed(
  () =>
    context.value && fields.value.every(field => contact.value[field]?.trim())
);
const content = computed(() =>
  context.value
    ? resolveMessengerTemplate(context.value.template.definition, contact.value)
    : null
);
const fail = failure => {
  if ([401, 403, 404].includes(failure.response?.status)) {
    context.value = null;
    contact.value = {};
    requestedFields.value = [];
  }
  error.value =
    failure.response?.status === 409
      ? t('MESSENGER_SIMULATOR.TEMPLATES.STALE')
      : t('MESSENGER_SIMULATOR.TEMPLATES.CONTEXT_ERROR');
};
const stillCurrent = operation =>
  active && operation === version && props.isCurrent();
const load = async () => {
  version += 1;
  const operation = version;
  busy.value = true;
  error.value = '';
  context.value = null;
  try {
    const { data } = selected.value
      ? await getMessengerTemplateContext(
          props.accountId,
          props.conversationId,
          { template_id: selected.value }
        )
      : await listMessengerTemplates(props.accountId);
    if (!stillCurrent(operation)) return;
    if (selected.value) {
      context.value = data;
      contact.value = { ...data.contact };
      requestedFields.value = fields.value.filter(
        field => !contact.value[field]?.trim()
      );
    } else records.value = data;
  } catch (failure) {
    if (stillCurrent(operation)) fail(failure);
  } finally {
    if (stillCurrent(operation)) busy.value = false;
  }
};
const download = async () => {
  if (busy.value || !ready.value) return;
  const operation = version;
  const isCurrent = () => stillCurrent(operation);
  const params = {
    template_id: context.value.template.id,
    context_token: context.value.context_token,
    authorize_only: true,
  };
  busy.value = true;
  error.value = '';
  try {
    await renderer.value.download({
      ...content.value,
      isCurrent,
      authorize: () =>
        getMessengerTemplateContext(
          props.accountId,
          props.conversationId,
          params
        ),
      filename: `messenger-template-${props.accountId}-${props.conversationId}`,
    });
    if (isCurrent()) dialog.value.close();
  } catch (failure) {
    if (isCurrent()) fail(failure);
  } finally {
    if (isCurrent()) busy.value = false;
  }
};
onMounted(() => {
  dialog.value.open();
  load();
});
onBeforeUnmount(() => {
  active = false;
  version += 1;
});
</script>

<template>
  <Dialog
    ref="dialog"
    overflow-y-auto
    :title="t('MESSENGER_SIMULATOR.TEMPLATES.CONVERSATION_EXPORT')"
    :description="t('MESSENGER_SIMULATOR.TEMPLATES.EXPORT_HINT')"
    :confirm-button-label="t('MESSENGER_SIMULATOR.EXPORT')"
    :disable-confirm-button="!ready || busy"
    :is-loading="busy"
    @confirm="download"
    @close="emit('close')"
  >
    <fieldset :disabled="busy" class="min-w-0 space-y-3">
      <label class="mb-0 flex flex-col gap-1 text-sm">
        {{ t('MESSENGER_SIMULATOR.TEMPLATES.LIBRARY') }}
        <select
          v-model="selected"
          class="mb-0 w-full rounded-lg border border-n-weak bg-n-solid-1 text-sm"
          @change="load"
        >
          <option value="">
            {{ t('MESSENGER_SIMULATOR.TEMPLATES.CHOOSE') }}
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
      <p v-if="!busy && !records.length && !error" class="text-sm">
        {{ t('MESSENGER_SIMULATOR.TEMPLATES.EMPTY') }}
      </p>
      <Input
        v-for="field in requestedFields"
        v-show="context"
        :key="field"
        v-model="contact[field]"
        :label="labels[field]"
        :maxlength="120"
        :message="t('MESSENGER_SIMULATOR.TEMPLATES.MISSING')"
      />
      <div
        v-if="context"
        class="max-h-[50vh] max-w-full overflow-auto rounded-lg border border-n-weak"
      >
        <MessengerSimulatorPreview
          :participants="content.participants"
          :messages="content.messages"
        />
      </div>
    </fieldset>
    <p v-if="busy" role="status" class="mb-0 text-sm">
      {{ t('MESSENGER_SIMULATOR.LOADING') }}
    </p>
    <div v-if="error" role="alert" class="space-y-2 text-sm text-n-ruby-11">
      <p class="mb-0">{{ error }}</p>
      <Button
        variant="ghost"
        :disabled="busy"
        :label="t('MESSENGER_SIMULATOR.RETRY')"
        @click="load"
      />
    </div>
    <MessengerScreenshotRenderer ref="renderer" />
  </Dialog>
</template>
