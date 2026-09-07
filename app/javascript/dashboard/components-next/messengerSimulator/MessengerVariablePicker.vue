<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CaretAnchoredPicker from 'dashboard/components-next/preview-picker/CaretAnchoredPicker.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import { MANUAL_PREFIX, slugifyManualKey } from './templateDefinition';

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
const manualName = ref('');
const filtersRef = ref(null);
const manualInputRef = ref(null);

const searchTerm = computed(() => searchQuery.value.trim().toLowerCase());

const manualSlug = computed(() => slugifyManualKey(manualName.value));
const manualInvalid = computed(
  () => Boolean(manualName.value.trim()) && !manualSlug.value
);

const groupLabels = computed(() => ({
  contact: t('MESSENGER_TEMPLATES.VARIABLES.GROUPS.CONTACT'),
  custom_attribute: t('MESSENGER_TEMPLATES.VARIABLES.GROUPS.CUSTOM_ATTRIBUTES'),
  agent: t('MESSENGER_TEMPLATES.VARIABLES.GROUPS.AGENT'),
  manual: t('MESSENGER_TEMPLATES.VARIABLES.GROUPS.MANUAL'),
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

const addManualVariable = () => {
  if (!manualSlug.value) return;
  const token = `{{${MANUAL_PREFIX}${manualSlug.value}}}`;
  manualName.value = '';
  emit('insert', token);
};

// The picker walks its list with Tab even while the search field has focus, and swallows
// the key there, so this row would be mouse-only. Claiming Tab first — in the capture
// phase, and only for a key pressed inside this picker — is the one way into it; the
// arrow keys still move the list selection.
const onCapturedKeydown = event => {
  const row = filtersRef.value;
  if (event.key !== 'Tab' || event.shiftKey || !row) return;
  if (row.contains(event.target)) return;
  if (!row.closest('[data-popover-content]')?.contains(event.target)) return;
  event.preventDefault();
  event.stopPropagation();
  manualInputRef.value?.focus();
};

onMounted(() => document.addEventListener('keydown', onCapturedKeydown, true));
onBeforeUnmount(() =>
  document.removeEventListener('keydown', onCapturedKeydown, true)
);

// The picker binds Tab, Backspace and Escape on the document with
// `allowOnFocusedInput`, so this field keeps its own keys instead of driving the list.
const onManualKeydown = event => {
  event.stopPropagation();
  if (event.key === 'Enter') {
    event.preventDefault();
    addManualVariable();
  } else if (event.key === 'Escape') {
    emit('close');
  }
};
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
    <!-- The picker blocks mousedown on this row to keep the caret; stopping the event
         here first lets the field take focus without moving the selection. -->
    <template #filters>
      <div ref="filtersRef" class="flex flex-col gap-1 px-1" @mousedown.stop>
        <label
          for="messenger-manual-variable"
          class="mb-0 text-xs font-medium text-n-slate-11"
        >
          {{ t('MESSENGER_TEMPLATES.VARIABLES.MANUAL.NEW') }}
        </label>
        <div class="flex items-center gap-2">
          <input
            id="messenger-manual-variable"
            ref="manualInputRef"
            v-model="manualName"
            type="text"
            maxlength="60"
            :placeholder="t('MESSENGER_TEMPLATES.VARIABLES.MANUAL.PLACEHOLDER')"
            :aria-invalid="manualInvalid"
            aria-describedby="messenger-manual-variable-hint"
            class="mb-0 h-8 w-full min-w-0 rounded-lg border border-n-weak bg-n-solid-1 px-2 text-sm text-n-slate-12 placeholder:text-n-slate-10 focus:border-n-blue-11 focus:ring-0"
            @keydown="onManualKeydown"
          />
          <Button
            size="sm"
            :label="t('MESSENGER_TEMPLATES.VARIABLES.MANUAL.ADD')"
            :disabled="!manualSlug"
            @mousedown.stop
            @click="addManualVariable"
          />
        </div>
        <span
          id="messenger-manual-variable-hint"
          class="text-xs"
          :class="manualInvalid ? 'text-n-ruby-11' : 'text-n-slate-10'"
        >
          {{
            manualInvalid
              ? t('MESSENGER_TEMPLATES.VARIABLES.MANUAL.INVALID')
              : t('MESSENGER_TEMPLATES.VARIABLES.MANUAL.HINT')
          }}
        </span>
      </div>
    </template>
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
