<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AddDataDropdown from 'dashboard/components-next/AssignmentPolicy/components/AddDataDropdown.vue';
import LabelItem from 'dashboard/components-next/label/LabelItem.vue';
import DurationInput from 'dashboard/components-next/input/DurationInput.vue';
import { DURATION_UNITS } from 'dashboard/components-next/input/constants';

const props = defineProps({
  tagsList: {
    type: Array,
    default: () => [],
  },
});

const excludedLabels = defineModel('excludedLabels', {
  type: Array,
  default: () => [],
});

const excludeOlderThanMinutes = defineModel('excludeOlderThanMinutes', {
  type: Number,
  default: null,
});

// The policy stores whole hours, so anything under an hour cannot round-trip
const MIN_DURATION_MINUTES = 60;
const MAX_DURATION_MINUTES = 1438560; // 999 days * 24 hours * 60 minutes

const { t } = useI18n();

const hoveredLabel = ref(null);
const windowUnit = ref(DURATION_UNITS.HOURS);

// The policy rounds to whole hours, so minutes is not an option the storage can round-trip
const DURATION_UNIT_OPTIONS = [DURATION_UNITS.HOURS, DURATION_UNITS.DAYS];

const addedTags = computed(() =>
  props.tagsList
    .filter(label => excludedLabels.value.includes(label.name))
    .map(label => ({ id: label.id, title: label.name, ...label }))
);

const filteredTags = computed(() =>
  props.tagsList.filter(
    label => !addedTags.value.some(tag => tag.id === label.id)
  )
);

const detectUnit = minutes => {
  const m = Number(minutes) || 0;
  return m && m % (24 * 60) === 0 ? DURATION_UNITS.DAYS : DURATION_UNITS.HOURS;
};

// Writes we made ourselves must not trigger a unit re-detect, or the field would jump
// units under the user mid-edit
const lastLocalValue = ref(undefined);

const durationInMinutes = computed({
  get: () => excludeOlderThanMinutes.value,
  set(value) {
    lastLocalValue.value = value;
    excludeOlderThanMinutes.value = value;
  },
});

const onClickAddTag = tag => {
  excludedLabels.value = [...excludedLabels.value, tag.name];
};

const onClickRemoveTag = tag => {
  excludedLabels.value = excludedLabels.value.filter(
    name => name !== tag.title
  );
};

// The policy loads after mount on the edit page, and a parent reset can swap one real
// value for another, so re-pick the unit on every change that did not come from this
// component's own input
watch(
  excludeOlderThanMinutes,
  value => {
    if (value === lastLocalValue.value) return;

    lastLocalValue.value = value;
    windowUnit.value = detectUnit(value);
  },
  { immediate: true }
);
</script>

<template>
  <div class="py-4 flex-col flex gap-6">
    <div class="flex flex-col items-start gap-1 py-1">
      <label class="text-sm font-medium text-n-slate-12 py-1">
        {{
          t(
            'ASSIGNMENT_POLICY.AGENT_CAPACITY_POLICY.FORM.EXCLUSION_RULES.LABEL'
          )
        }}
      </label>
      <p class="mb-0 text-n-slate-11 text-sm">
        {{
          t(
            'ASSIGNMENT_POLICY.AGENT_CAPACITY_POLICY.FORM.EXCLUSION_RULES.DESCRIPTION'
          )
        }}
      </p>
    </div>

    <div class="flex flex-col items-start gap-4">
      <label class="text-sm font-medium text-n-slate-12 py-1">
        {{
          t(
            'ASSIGNMENT_POLICY.AGENT_CAPACITY_POLICY.FORM.EXCLUSION_RULES.TAGS.LABEL'
          )
        }}
      </label>
      <div
        class="flex items-start gap-2 flex-wrap"
        @mouseleave="hoveredLabel = null"
      >
        <LabelItem
          v-for="tag in addedTags"
          :key="tag.id"
          :label="tag"
          :is-hovered="hoveredLabel === tag.id"
          class="h-8"
          @remove="onClickRemoveTag"
          @hover="hoveredLabel = tag.id"
        />
        <AddDataDropdown
          :label="
            t(
              'ASSIGNMENT_POLICY.AGENT_CAPACITY_POLICY.FORM.EXCLUSION_RULES.TAGS.ADD_TAG'
            )
          "
          :search-placeholder="
            t(
              'ASSIGNMENT_POLICY.AGENT_CAPACITY_POLICY.FORM.EXCLUSION_RULES.TAGS.DROPDOWN.SEARCH_PLACEHOLDER'
            )
          "
          :items="filteredTags"
          class="[&>button]:!text-n-blue-11 [&>div]:min-w-64"
          @add="onClickAddTag"
        />
      </div>
    </div>

    <div class="flex flex-col items-start gap-4">
      <label class="text-sm font-medium text-n-slate-12 py-1">
        {{
          t(
            'ASSIGNMENT_POLICY.AGENT_CAPACITY_POLICY.FORM.EXCLUSION_RULES.DURATION.LABEL'
          )
        }}
      </label>
      <div
        class="flex items-center gap-2 flex-1 [&>select]:!bg-n-alpha-2 [&>select]:!outline-none [&>select]:hover:brightness-110"
      >
        <!-- allow 1 hour to 999 days -->
        <DurationInput
          v-model:unit="windowUnit"
          v-model:model-value="durationInMinutes"
          :units="DURATION_UNIT_OPTIONS"
          :min="MIN_DURATION_MINUTES"
          :max="MAX_DURATION_MINUTES"
        />
      </div>
    </div>
  </div>
</template>
