<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CaretAnchoredPicker from 'dashboard/components-next/preview-picker/CaretAnchoredPicker.vue';

const props = defineProps({
  caretPosition: {
    type: Object,
    default: null,
  },
  entries: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['insert', 'close']);

const { t } = useI18n();

const searchQuery = ref('');

const searchTerm = computed(() => searchQuery.value.trim().toLowerCase());

const groupLabels = computed(() => ({
  contact: t('MESSENGER_TEMPLATES.VARIABLES.GROUPS.CONTACT'),
  custom_attribute: t('MESSENGER_TEMPLATES.VARIABLES.GROUPS.CUSTOM_ATTRIBUTES'),
  agent: t('MESSENGER_TEMPLATES.VARIABLES.GROUPS.AGENT'),
}));

// Static keys carry an i18n key from the server catalog; custom attributes carry the
// admin's own display name, which is never translated.
const entryLabel = entry =>
  entry.labelKey ? t(entry.labelKey) : entry.label || entry.key;

// The catalog arrives grouped, and filtering preserves that order so the picker's
// group headers stay contiguous.
const items = computed(() =>
  props.entries
    .map(entry => ({
      id: entry.key,
      key: entry.key,
      token: `{{${entry.key}}}`,
      label: `{{${entry.key}}}`,
      title: entryLabel(entry),
      subtitle: `{{${entry.key}}}`,
      group: groupLabels.value[entry.group] || entry.group,
      sample: entry.sample,
      description: entry.description,
    }))
    .filter(
      item =>
        !searchTerm.value ||
        `${item.title} ${item.key}`.toLowerCase().includes(searchTerm.value)
    )
);

const onSelect = item => emit('insert', item.token);
</script>

<template>
  <CaretAnchoredPicker
    v-model:search="searchQuery"
    :caret-position="caretPosition"
    :items="items"
    :search-placeholder="t('MESSENGER_TEMPLATES.VARIABLES.SEARCH_PLACEHOLDER')"
    :empty-label="t('MESSENGER_TEMPLATES.VARIABLES.EMPTY')"
    @select="onSelect"
    @close="emit('close')"
    @remove-trigger="emit('close')"
  >
    <template #preview="{ item }">
      <div v-if="item" class="flex flex-col gap-2 px-4 py-3">
        <span class="text-sm break-words text-n-slate-12">
          {{ item.token }}
        </span>
        <span v-if="item.description" class="text-xs text-n-slate-11">
          {{ item.description }}
        </span>
        <span v-if="item.sample" class="text-xs break-words text-n-slate-10">
          {{
            t('MESSENGER_TEMPLATES.VARIABLES.SAMPLE', { sample: item.sample })
          }}
        </span>
      </div>
    </template>
  </CaretAnchoredPicker>
</template>
