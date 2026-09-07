<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAdmin } from 'dashboard/composables/useAdmin';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import Button from 'dashboard/components-next/button/Button.vue';
import ConfirmButton from 'dashboard/components-next/button/ConfirmButton.vue';

const props = defineProps({
  accountId: { type: Number, required: true },
  dirty: { type: Boolean, default: false },
});
const emit = defineEmits(['load']);

const selection = defineModel('selection', { type: String, default: 'manual' });

const { t } = useI18n();
const { isAdmin } = useAdmin();
const store = useStore();

const records = useMapGetter('messengerTemplates/getTemplates');
const uiFlags = useMapGetter('messengerTemplates/getUIFlags');
const error = ref('');

const manageRoute = computed(() => ({
  name: 'messenger_templates_list',
  params: { accountId: String(props.accountId) },
}));

// The store lists the account default first; the badge repeats that in the option text,
// which is the only place a `<select>` can carry it.
const optionLabel = record =>
  record.is_default
    ? `${record.title} · ${t('MESSENGER_TEMPLATES.DEFAULT.BADGE')}`
    : record.title;

const load = () => {
  const record =
    records.value.find(item => String(item.id) === selection.value) || null;
  emit('load', record);
};

onMounted(async () => {
  try {
    await store.dispatch('messengerTemplates/get', props.accountId);
  } catch (failure) {
    error.value =
      failure?.response?.data?.message ??
      t('MESSENGER_TEMPLATES.SIMULATOR.ERROR');
  }
});
</script>

<template>
  <section
    :aria-label="t('MESSENGER_TEMPLATES.SIMULATOR.LOAD_TEMPLATE')"
    class="border-b border-n-weak px-5 py-4 lg:px-8"
  >
    <div class="flex flex-wrap items-end gap-3">
      <label
        for="messenger-template-picker"
        class="mb-0 flex min-w-0 flex-1 flex-col gap-1 text-sm text-n-slate-12"
      >
        {{ t('MESSENGER_TEMPLATES.SIMULATOR.SELECT_LABEL') }}
        <select
          id="messenger-template-picker"
          v-model="selection"
          :disabled="uiFlags.isFetching"
          class="mb-0 w-full rounded-lg border border-n-weak bg-n-solid-1 text-sm text-n-slate-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon"
        >
          <option value="manual">
            {{ t('MESSENGER_TEMPLATES.SIMULATOR.MANUAL') }}
          </option>
          <option
            v-for="record in records"
            :key="record.id"
            :value="String(record.id)"
          >
            {{ optionLabel(record) }}
          </option>
        </select>
      </label>
      <ConfirmButton
        v-if="dirty"
        :label="t('MESSENGER_TEMPLATES.SIMULATOR.LOAD_TEMPLATE')"
        :confirm-label="t('MESSENGER_TEMPLATES.SIMULATOR.DISCARD_DRAFT')"
        :disabled="uiFlags.isFetching"
        @click="load"
      />
      <Button
        v-else
        :label="t('MESSENGER_TEMPLATES.SIMULATOR.LOAD_TEMPLATE')"
        :disabled="uiFlags.isFetching"
        @click="load"
      />
      <router-link
        v-if="isAdmin"
        :to="manageRoute"
        class="inline-flex h-8 items-center rounded-lg px-2 text-sm font-medium text-n-blue-11 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon"
      >
        {{ t('MESSENGER_TEMPLATES.SIMULATOR.MANAGE') }}
      </router-link>
    </div>
    <p v-if="error" role="alert" class="mb-0 mt-2 text-sm text-n-ruby-11">
      {{ error }}
    </p>
    <p
      v-else-if="uiFlags.isFetching"
      role="status"
      class="mb-0 mt-2 text-sm text-n-slate-11"
    >
      {{ t('MESSENGER_TEMPLATES.SIMULATOR.LOADING') }}
    </p>
    <p v-else-if="!records.length" class="mb-0 mt-2 text-xs text-n-slate-11">
      {{ t('MESSENGER_TEMPLATES.SIMULATOR.EMPTY') }}
    </p>
    <p v-if="!isAdmin" class="mb-0 mt-2 text-xs text-n-slate-11">
      {{ t('MESSENGER_SIMULATOR.TEMPLATES.HINT') }}
    </p>
  </section>
</template>
