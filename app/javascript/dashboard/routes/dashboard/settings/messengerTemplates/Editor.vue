<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { useAlert } from 'dashboard/composables';
import { useAccount } from 'dashboard/composables/useAccount';
import { useStore, useMapGetter } from 'dashboard/composables/store';

import SettingsLayout from '../SettingsLayout.vue';
import BaseSettingsHeader from '../components/BaseSettingsHeader.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import Dialog from 'dashboard/components-next/dialog/Dialog.vue';
import Input from 'dashboard/components-next/input/Input.vue';
import MessengerSimulatorEditor from 'dashboard/components-next/messengerSimulator/MessengerSimulatorEditor.vue';
import { buildDuplicateTitle, MAX_TITLE_LENGTH } from './duplicateTitle';

defineOptions({
  name: 'MessengerTemplateEditorSettings',
});

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useStore();
const { accountId, accountScopedRoute } = useAccount();

const uiFlags = useMapGetter('messengerTemplates/getUIFlags');
const findTemplate = useMapGetter('messengerTemplates/getTemplate');
const records = useMapGetter('messengerTemplates/getTemplates');

const templateId = computed(() => {
  const id = Number(route.params.templateId);
  return Number.isNaN(id) || !id ? null : id;
});
const isEditing = computed(() => Boolean(templateId.value));

const title = ref('');
const definition = ref(null);
const editorRef = ref(null);
const leaveDialogRef = ref(null);
const baseline = ref('');
const isLoading = ref(true);
const notFound = ref(false);
const errorMessage = ref('');
const errorAttributes = ref([]);

const isSaving = computed(
  () => uiFlags.value.isCreating || uiFlags.value.isUpdating
);
// `render_record_invalid` joins every message into one string, so it can sit under the
// title input only when the title is the one attribute the server rejected.
const isTitleOnlyError = computed(
  () =>
    errorAttributes.value.length === 1 && errorAttributes.value[0] === 'title'
);
const titleError = computed(() =>
  isTitleOnlyError.value ? errorMessage.value : ''
);
const formError = computed(() =>
  isTitleOnlyError.value ? '' : errorMessage.value
);
// An unknown variable is the one invalid state the editor can name precisely, so it
// blocks saving and says which token to fix instead of the generic "add a title" text.
const variableErrors = computed(
  () => editorRef.value?.getValidationErrors() ?? []
);
const variableError = computed(() =>
  variableErrors.value.length
    ? t('MESSENGER_TEMPLATES.VARIABLES.UNKNOWN', {
        token: variableErrors.value[0],
      })
    : ''
);
const listRoute = computed(() =>
  accountScopedRoute('messenger_templates_list')
);
const dirty = computed(
  () =>
    Boolean(baseline.value) &&
    (editorRef.value?.getSnapshot() !== baseline.value ||
      title.value.trim() !==
        (findTemplate.value(templateId.value)?.title ?? ''))
);
const headerTitle = computed(() =>
  isEditing.value
    ? t('MESSENGER_TEMPLATES.EDITOR.EDIT_TITLE')
    : t('MESSENGER_TEMPLATES.EDITOR.NEW_TITLE')
);

const emptyDefinition = () => ({
  version: 1,
  business_name: t('MESSENGER_SIMULATOR.EXAMPLE_OUTGOING_NAME'),
  avatar: 'contact',
  messages: [],
});

const goToList = () => router.push(listRoute.value);

const reportError = error => {
  const data = error?.response?.data;
  errorMessage.value =
    data?.message || t('MESSENGER_TEMPLATES.EDITOR.SAVE_ERROR');
  errorAttributes.value = data?.attributes ?? [];
};

const onAccessDenied = () => {
  errorMessage.value = t('MESSENGER_SIMULATOR.UNAVAILABLE');
  errorAttributes.value = [];
};

const duplicateTitle = base =>
  buildDuplicateTitle(
    base,
    records.value.map(record => record.title),
    (candidate, copy) =>
      copy === 1
        ? t('MESSENGER_TEMPLATES.SETTINGS.DUPLICATE_TITLE', {
            title: candidate,
          })
        : t('MESSENGER_TEMPLATES.SETTINGS.DUPLICATE_TITLE_N', {
            title: candidate,
            count: copy,
          })
  );

const load = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  errorAttributes.value = [];
  if (!isEditing.value) {
    title.value = '';
    definition.value = emptyDefinition();
    isLoading.value = false;
    return;
  }
  try {
    if (!findTemplate.value(templateId.value)) {
      await store.dispatch('messengerTemplates/get', accountId.value);
    }
    const record = findTemplate.value(templateId.value);
    if (!record) {
      notFound.value = true;
      return;
    }
    title.value = record.title;
    definition.value = record.definition;
  } catch (error) {
    reportError(error);
    notFound.value = true;
  } finally {
    isLoading.value = false;
  }
};

const submit = async duplicate => {
  errorMessage.value = '';
  errorAttributes.value = [];
  const payloadDefinition = editorRef.value?.getDefinition();
  if (!title.value.trim()) {
    errorMessage.value = t('MESSENGER_TEMPLATES.EDITOR.NAME.REQUIRED');
    errorAttributes.value = ['title'];
    return;
  }
  if (!payloadDefinition) {
    errorMessage.value = t('MESSENGER_TEMPLATES.EDITOR.INVALID');
    return;
  }
  const template = {
    title: duplicate ? duplicateTitle(title.value.trim()) : title.value.trim(),
    definition: payloadDefinition,
  };
  try {
    if (isEditing.value && !duplicate) {
      await store.dispatch('messengerTemplates/update', {
        accountId: accountId.value,
        id: templateId.value,
        template,
      });
      useAlert(t('MESSENGER_TEMPLATES.EDITOR.UPDATE_SUCCESS'));
    } else {
      await store.dispatch('messengerTemplates/create', {
        accountId: accountId.value,
        template,
      });
      useAlert(
        duplicate
          ? t('MESSENGER_TEMPLATES.EDITOR.COPY_SUCCESS')
          : t('MESSENGER_TEMPLATES.EDITOR.CREATE_SUCCESS')
      );
    }
    baseline.value = '';
    goToList();
  } catch (error) {
    reportError(error);
  }
};

watch(editorRef, async instance => {
  baseline.value = '';
  if (!instance) return;
  await nextTick();
  baseline.value = instance.getSnapshot();
});

let confirmLeave = null;

// `Dialog.close()` emits `close` again, so the pending resolver is what tells a real
// answer apart from that echo; without it the two would call each other forever.
const resolveLeave = allowed => {
  const resolve = confirmLeave;
  if (!resolve) return;
  confirmLeave = null;
  leaveDialogRef.value.close();
  resolve(allowed);
};

// Every exit is guarded, not only the Cancel button: the back link, the sidebar and any
// other route change all reach this before the draft is dropped.
onBeforeRouteLeave(() => {
  if (!dirty.value) return true;
  leaveDialogRef.value.open();
  return new Promise(resolve => {
    confirmLeave = resolve;
  });
});

onMounted(load);
</script>

<template>
  <SettingsLayout
    :is-loading="isLoading"
    :loading-message="t('MESSENGER_TEMPLATES.SETTINGS.LOADING')"
    :no-records-found="notFound"
    :no-records-message="t('MESSENGER_TEMPLATES.EDITOR.NOT_FOUND')"
  >
    <template #header>
      <BaseSettingsHeader
        :title="headerTitle"
        :description="t('MESSENGER_TEMPLATES.EDITOR.DESCRIPTION')"
        :back-button-label="t('MESSENGER_TEMPLATES.EDITOR.BACK')"
        :back-url="listRoute"
      />
    </template>

    <template #body>
      <div class="flex w-full flex-col gap-4">
        <Input
          id="messenger-template-title"
          v-model="title"
          class="min-w-0"
          :label="t('MESSENGER_TEMPLATES.EDITOR.NAME.LABEL')"
          :placeholder="t('MESSENGER_TEMPLATES.EDITOR.NAME.PLACEHOLDER')"
          :maxlength="MAX_TITLE_LENGTH"
          :message="titleError"
          :message-type="titleError ? 'error' : 'info'"
          required
        />
        <p v-if="formError" role="alert" class="mb-0 text-sm text-n-ruby-11">
          {{ formError }}
        </p>
        <div
          class="flex min-w-0 flex-col overflow-hidden rounded-xl border border-n-weak bg-n-solid-1"
        >
          <MessengerSimulatorEditor
            v-if="definition"
            ref="editorRef"
            :account-id="accountId"
            :initial-definition="definition"
            :disabled="isSaving"
            @access-denied="onAccessDenied"
          />
        </div>
        <p
          v-if="variableError"
          role="alert"
          class="mb-0 text-sm text-n-ruby-11"
        >
          {{ variableError }}
        </p>
        <div class="flex flex-wrap items-center justify-end gap-3">
          <Button
            color="slate"
            variant="ghost"
            :label="t('MESSENGER_TEMPLATES.EDITOR.CANCEL')"
            @click="goToList"
          />
          <Button
            v-if="isEditing"
            color="slate"
            variant="outline"
            :label="t('MESSENGER_TEMPLATES.EDITOR.SAVE_COPY')"
            :disabled="isSaving || variableErrors.length > 0"
            @click="submit(true)"
          />
          <Button
            :label="
              isSaving
                ? t('MESSENGER_TEMPLATES.EDITOR.SAVING')
                : t('MESSENGER_TEMPLATES.EDITOR.SAVE')
            "
            :is-loading="isSaving"
            :disabled="isSaving || variableErrors.length > 0"
            @click="submit(false)"
          />
        </div>
        <Dialog
          ref="leaveDialogRef"
          type="alert"
          :title="t('MESSENGER_TEMPLATES.EDITOR.UNSAVED.TITLE')"
          :description="t('MESSENGER_TEMPLATES.EDITOR.UNSAVED.MESSAGE')"
          :confirm-button-label="
            t('MESSENGER_TEMPLATES.EDITOR.UNSAVED.CONFIRM')
          "
          :cancel-button-label="t('MESSENGER_TEMPLATES.EDITOR.UNSAVED.CANCEL')"
          @confirm="resolveLeave(true)"
          @close="resolveLeave(false)"
        />
      </div>
    </template>
  </SettingsLayout>
</template>
