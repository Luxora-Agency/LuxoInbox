<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAlert } from 'dashboard/composables';
import { useAccount } from 'dashboard/composables/useAccount';
import { useStore, useMapGetter } from 'dashboard/composables/store';

import SettingsLayout from '../SettingsLayout.vue';
import BaseSettingsHeader from '../components/BaseSettingsHeader.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import ConfirmButton from 'dashboard/components-next/button/ConfirmButton.vue';
import Input from 'dashboard/components-next/input/Input.vue';
import MessengerSimulatorEditor from 'dashboard/components-next/messengerSimulator/MessengerSimulatorEditor.vue';

defineOptions({
  name: 'MessengerTemplateEditorSettings',
});

const MAX_TITLE_LENGTH = 100;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useStore();
const { accountId, accountScopedRoute } = useAccount();

const uiFlags = useMapGetter('messengerTemplates/getUIFlags');
const findTemplate = useMapGetter('messengerTemplates/getTemplate');

const templateId = computed(() => {
  const id = Number(route.params.templateId);
  return Number.isNaN(id) || !id ? null : id;
});
const isEditing = computed(() => Boolean(templateId.value));

const title = ref('');
const definition = ref(null);
const editorRef = ref(null);
const baseline = ref('');
const isLoading = ref(true);
const notFound = ref(false);
const errorMessage = ref('');
const errorAttributes = ref([]);

const isSaving = computed(
  () => uiFlags.value.isCreating || uiFlags.value.isUpdating
);
const titleError = computed(() =>
  errorAttributes.value.includes('title') ? errorMessage.value : ''
);
const formError = computed(() =>
  errorMessage.value && !titleError.value ? errorMessage.value : ''
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

const goToList = () =>
  router.push(accountScopedRoute('messenger_templates_list'));

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
    title: duplicate
      ? t('MESSENGER_TEMPLATES.SETTINGS.DUPLICATE_TITLE', {
          title: title.value.trim(),
        }).slice(0, MAX_TITLE_LENGTH)
      : title.value.trim(),
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
        <p
          v-if="formError"
          role="alert"
          class="mb-0 text-sm text-n-ruby-11 dark:text-n-ruby-11"
        >
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
        <div class="flex flex-wrap items-center justify-end gap-3">
          <ConfirmButton
            v-if="dirty"
            color="slate"
            variant="ghost"
            :label="t('MESSENGER_TEMPLATES.EDITOR.CANCEL')"
            :confirm-label="t('MESSENGER_TEMPLATES.EDITOR.UNSAVED.CONFIRM')"
            @click="goToList"
          />
          <Button
            v-else
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
            :disabled="isSaving"
            @click="submit(true)"
          />
          <Button
            :label="
              isSaving
                ? t('MESSENGER_TEMPLATES.EDITOR.SAVING')
                : t('MESSENGER_TEMPLATES.EDITOR.SAVE')
            "
            :is-loading="isSaving"
            :disabled="isSaving"
            @click="submit(false)"
          />
        </div>
      </div>
    </template>
  </SettingsLayout>
</template>
