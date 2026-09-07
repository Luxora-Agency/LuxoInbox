<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'dashboard/components-next/button/Button.vue';
import { applySuggestionsToDefinition } from './templateDefinition';

const props = defineProps({
  suggestions: { type: Array, default: () => [] },
  definition: { type: Object, required: true },
});

const emit = defineEmits(['apply', 'skip']);

const { t } = useI18n();

const selected = ref([]);

// Dynamic keys read real contact or agent data, so they are safe to accept as read.
// A manual key commits the agent to typing a value on every export, so it is opt-in.
watch(
  () => props.suggestions,
  suggestions => {
    selected.value = suggestions.map(
      suggestion => suggestion.kind === 'dynamic'
    );
  },
  { immediate: true }
);

const rows = computed(() =>
  props.suggestions.map((suggestion, index) => ({
    index,
    id: `messenger-suggestion-${index}`,
    kind: suggestion.kind,
    kindLabel:
      suggestion.kind === 'manual'
        ? t('MESSENGER_TEMPLATES.AI.SUGGESTIONS.MANUAL')
        : t('MESSENGER_TEMPLATES.AI.SUGGESTIONS.DYNAMIC'),
    label: suggestion.label || suggestion.key,
    token: `{{${suggestion.key}}}`,
    originalText: suggestion.original_text,
    reason: suggestion.reason,
  }))
);

const acceptedCount = computed(() => selected.value.filter(Boolean).length);

const apply = () => {
  const accepted = props.suggestions.filter(
    (_, index) => selected.value[index]
  );
  if (!accepted.length) return;
  emit('apply', applySuggestionsToDefinition(props.definition, accepted));
};
</script>

<template>
  <section
    aria-labelledby="messenger-suggestions-title"
    class="flex flex-col gap-3 rounded-xl border border-n-weak bg-n-solid-1 p-4"
  >
    <div class="flex flex-col gap-1">
      <h3
        id="messenger-suggestions-title"
        class="mb-0 text-sm font-semibold text-n-slate-12"
      >
        {{ t('MESSENGER_TEMPLATES.AI.SUGGESTIONS.TITLE') }}
      </h3>
      <p class="mb-0 text-xs leading-5 text-n-slate-11">
        {{ t('MESSENGER_TEMPLATES.AI.SUGGESTIONS.DESCRIPTION') }}
      </p>
    </div>
    <p v-if="!rows.length" class="mb-0 text-sm text-n-slate-11">
      {{ t('MESSENGER_TEMPLATES.AI.SUGGESTIONS.EMPTY') }}
    </p>
    <ul v-else class="m-0 flex list-none flex-col gap-2 p-0">
      <li
        v-for="row in rows"
        :key="row.id"
        class="flex min-w-0 gap-3 rounded-lg bg-n-alpha-1 px-3 py-2"
      >
        <input
          :id="row.id"
          v-model="selected[row.index]"
          type="checkbox"
          class="mt-1 size-4 shrink-0 accent-n-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-n-brand"
        />
        <div class="flex min-w-0 flex-col gap-1">
          <label
            :for="row.id"
            class="mb-0 flex flex-wrap items-center gap-2 text-sm font-medium text-n-slate-12"
          >
            {{ row.label }}
            <span
              class="rounded-md px-1.5 py-0.5 text-xs font-medium"
              :class="
                row.kind === 'manual'
                  ? 'bg-n-amber-3 text-n-amber-12'
                  : 'bg-n-blue-3 text-n-blue-12'
              "
            >
              {{ row.kindLabel }}
            </span>
            <code class="text-xs font-normal text-n-slate-11">
              {{ row.token }}
            </code>
          </label>
          <p
            v-if="row.originalText"
            class="mb-0 break-words text-xs text-n-slate-11 [overflow-wrap:anywhere]"
          >
            {{
              t('MESSENGER_TEMPLATES.AI.SUGGESTIONS.ORIGINAL', {
                text: row.originalText,
              })
            }}
          </p>
          <p v-if="row.reason" class="mb-0 text-xs text-n-slate-10">
            {{
              t('MESSENGER_TEMPLATES.AI.SUGGESTIONS.REASON', {
                reason: row.reason,
              })
            }}
          </p>
        </div>
      </li>
    </ul>
    <div class="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="ghost"
        color="slate"
        size="sm"
        :label="t('MESSENGER_TEMPLATES.AI.SUGGESTIONS.SKIP')"
        @click="emit('skip')"
      />
      <Button
        v-if="rows.length"
        size="sm"
        :label="t('MESSENGER_TEMPLATES.AI.SUGGESTIONS.APPLY')"
        :disabled="!acceptedCount"
        @click="apply"
      />
    </div>
  </section>
</template>
