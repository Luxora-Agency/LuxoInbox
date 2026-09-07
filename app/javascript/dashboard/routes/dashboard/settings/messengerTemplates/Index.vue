<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { picoSearch } from '@chatwoot/pico-search';
import { useAlert } from 'dashboard/composables';
import { useAccount } from 'dashboard/composables/useAccount';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import { dynamicTime } from 'shared/helpers/timeHelper';

import SettingsLayout from '../SettingsLayout.vue';
import BaseSettingsHeader from '../components/BaseSettingsHeader.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import ConfirmButton from 'dashboard/components-next/button/ConfirmButton.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import {
  BaseTable,
  BaseTableRow,
  BaseTableCell,
} from 'dashboard/components-next/table';

defineOptions({
  name: 'MessengerTemplatesSettings',
});

const MAX_TITLE_LENGTH = 100;

const { t } = useI18n();
const router = useRouter();
const store = useStore();
const { accountId, accountScopedRoute } = useAccount();

const records = useMapGetter('messengerTemplates/getTemplates');
const uiFlags = useMapGetter('messengerTemplates/getUIFlags');

const searchQuery = ref('');
const errorMessage = ref('');
const pendingId = ref(null);

const filteredRecords = computed(() => {
  const query = searchQuery.value.trim();
  if (!query) return records.value;
  return picoSearch(records.value, query, [{ name: 'title', weight: 4 }]);
});

const tableHeaders = computed(() => [
  t('MESSENGER_TEMPLATES.SETTINGS.TABLE.TITLE'),
  t('MESSENGER_TEMPLATES.SETTINGS.TABLE.MESSAGES'),
  t('MESSENGER_TEMPLATES.SETTINGS.TABLE.UPDATED_AT'),
  t('MESSENGER_TEMPLATES.SETTINGS.TABLE.ACTIONS'),
]);

const messageCount = record =>
  t('MESSENGER_TEMPLATES.SETTINGS.MESSAGE_COUNT', {
    count: record.definition?.messages?.length ?? 0,
  });

const updatedAt = record => {
  const timestamp = Date.parse(record.updated_at);
  if (Number.isNaN(timestamp)) {
    return t('MESSENGER_TEMPLATES.SETTINGS.NEVER_UPDATED');
  }
  return dynamicTime(Math.floor(timestamp / 1000));
};

const reportError = (error, fallback) => {
  errorMessage.value = error?.response?.data?.message ?? fallback;
  useAlert(errorMessage.value);
};

const fetchRecords = async () => {
  errorMessage.value = '';
  try {
    await store.dispatch('messengerTemplates/get', accountId.value);
  } catch (error) {
    reportError(error, t('MESSENGER_TEMPLATES.SETTINGS.LOAD_ERROR'));
  }
};

const goToNew = () =>
  router.push(accountScopedRoute('messenger_templates_new'));

const goToEdit = record =>
  router.push(
    accountScopedRoute('messenger_templates_edit', {
      templateId: String(record.id),
    })
  );

const duplicate = async record => {
  errorMessage.value = '';
  pendingId.value = record.id;
  try {
    await store.dispatch('messengerTemplates/create', {
      accountId: accountId.value,
      template: {
        title: t('MESSENGER_TEMPLATES.SETTINGS.DUPLICATE_TITLE', {
          title: record.title,
        }).slice(0, MAX_TITLE_LENGTH),
        definition: record.definition,
      },
    });
    useAlert(t('MESSENGER_TEMPLATES.SETTINGS.DUPLICATE_SUCCESS'));
  } catch (error) {
    reportError(error, t('MESSENGER_TEMPLATES.SETTINGS.DUPLICATE_ERROR'));
  } finally {
    pendingId.value = null;
  }
};

const remove = async record => {
  errorMessage.value = '';
  pendingId.value = record.id;
  try {
    await store.dispatch('messengerTemplates/delete', {
      accountId: accountId.value,
      id: record.id,
    });
    useAlert(t('MESSENGER_TEMPLATES.SETTINGS.DELETE_SUCCESS'));
  } catch (error) {
    reportError(error, t('MESSENGER_TEMPLATES.SETTINGS.DELETE_ERROR'));
  } finally {
    pendingId.value = null;
  }
};

onMounted(fetchRecords);
</script>

<template>
  <SettingsLayout
    :is-loading="uiFlags.isFetching && !records.length"
    :loading-message="t('MESSENGER_TEMPLATES.SETTINGS.LOADING')"
  >
    <template #header>
      <BaseSettingsHeader
        v-model:search-query="searchQuery"
        :title="t('MESSENGER_TEMPLATES.SETTINGS.TITLE')"
        :description="t('MESSENGER_TEMPLATES.SETTINGS.DESCRIPTION')"
        :search-placeholder="
          t('MESSENGER_TEMPLATES.SETTINGS.SEARCH_PLACEHOLDER')
        "
      >
        <template #actions>
          <Button
            data-tour="messenger-template-add"
            :label="t('MESSENGER_TEMPLATES.SETTINGS.NEW')"
            size="sm"
            @click="goToNew"
          />
        </template>
      </BaseSettingsHeader>
    </template>

    <template #body>
      <p
        v-if="errorMessage"
        role="alert"
        class="mb-3 text-sm text-n-ruby-11 dark:text-n-ruby-11"
      >
        {{ errorMessage }}
      </p>
      <div
        v-if="!records.length"
        class="flex flex-col items-center justify-center gap-3 py-20 text-center"
      >
        <span
          class="flex items-center justify-center rounded-full size-10 bg-n-alpha-1"
        >
          <Icon icon="i-lucide-image" class="size-5 text-n-slate-10" />
        </span>
        <h2 class="mb-0 text-heading-3 text-n-slate-12">
          {{ t('MESSENGER_TEMPLATES.SETTINGS.EMPTY.TITLE') }}
        </h2>
        <p class="mb-0 max-w-prose text-body-main text-n-slate-11">
          {{ t('MESSENGER_TEMPLATES.SETTINGS.EMPTY.DESCRIPTION') }}
        </p>
        <Button
          size="sm"
          :label="t('MESSENGER_TEMPLATES.SETTINGS.EMPTY.ACTION')"
          @click="goToNew"
        />
      </div>
      <BaseTable
        v-else
        :headers="tableHeaders"
        :items="filteredRecords"
        :loading="uiFlags.isFetching"
        :no-data-message="
          t('MESSENGER_TEMPLATES.SETTINGS.NO_RESULTS.DESCRIPTION', {
            query: searchQuery,
          })
        "
      >
        <template #row="{ items }">
          <BaseTableRow v-for="record in items" :key="record.id" :item="record">
            <template #default>
              <BaseTableCell class="max-w-0">
                <span class="block truncate text-heading-3 text-n-slate-12">
                  {{ record.title }}
                </span>
              </BaseTableCell>
              <BaseTableCell class="w-32 whitespace-nowrap">
                <span class="text-body-main text-n-slate-11">
                  {{ messageCount(record) }}
                </span>
              </BaseTableCell>
              <BaseTableCell class="w-40 whitespace-nowrap">
                <span class="text-body-main text-n-slate-11">
                  {{ updatedAt(record) }}
                </span>
              </BaseTableCell>
              <BaseTableCell align="end" class="w-44">
                <div class="flex flex-shrink-0 items-center justify-end gap-3">
                  <Button
                    v-tooltip.top="t('MESSENGER_TEMPLATES.SETTINGS.EDIT')"
                    icon="i-woot-edit-pen"
                    slate
                    sm
                    :aria-label="t('MESSENGER_TEMPLATES.SETTINGS.EDIT')"
                    @click="goToEdit(record)"
                  />
                  <Button
                    v-tooltip.top="t('MESSENGER_TEMPLATES.SETTINGS.DUPLICATE')"
                    icon="i-lucide-copy"
                    slate
                    sm
                    :aria-label="t('MESSENGER_TEMPLATES.SETTINGS.DUPLICATE')"
                    :is-loading="pendingId === record.id && uiFlags.isCreating"
                    @click="duplicate(record)"
                  />
                  <ConfirmButton
                    color="slate"
                    variant="ghost"
                    size="sm"
                    :label="t('MESSENGER_TEMPLATES.SETTINGS.DELETE')"
                    :confirm-label="
                      t('MESSENGER_TEMPLATES.SETTINGS.DELETE_CONFIRM.CONFIRM')
                    "
                    :is-loading="pendingId === record.id && uiFlags.isDeleting"
                    @click="remove(record)"
                  />
                </div>
              </BaseTableCell>
            </template>
          </BaseTableRow>
        </template>
      </BaseTable>
    </template>
  </SettingsLayout>
</template>
