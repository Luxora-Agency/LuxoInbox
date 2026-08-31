<script setup>
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Input from 'dashboard/components-next/input/Input.vue';
import DurationInput from 'dashboard/components-next/input/DurationInput.vue';
import { DURATION_UNITS } from 'dashboard/components-next/input/constants';
import {
  DEFAULT_FAIR_DISTRIBUTION_LIMIT,
  MIN_FAIR_DISTRIBUTION_LIMIT,
  MAX_FAIR_DISTRIBUTION_LIMIT,
} from 'dashboard/routes/dashboard/settings/assignmentPolicy/constants';

const emit = defineEmits(['validationChange']);

const { t } = useI18n();

// The window is stored in seconds but edited in minutes; 10 minutes is the shortest
// window the input offers and the shortest one worth rate limiting on
const MIN_WINDOW_MINUTES = 10;
const MAX_WINDOW_MINUTES = 1438560; // 999 days

const fairDistributionLimit = defineModel('fairDistributionLimit', {
  type: Number,
  default: DEFAULT_FAIR_DISTRIBUTION_LIMIT,
  set(value) {
    return Number(value) || 0;
  },
});

// The model value is in seconds (for the backend/DB)
// DurationInput works in minutes internally
// We need to convert between seconds and minutes
const fairDistributionWindow = defineModel('fairDistributionWindow', {
  type: Number,
  default: 3600,
  set(value) {
    return Number(value) || 0;
  },
});

// Owned by the parent form so the chosen unit survives a re-render and never
// leaks onto the DOM as a stray attribute
const windowUnit = defineModel('windowUnit', {
  type: String,
  default: DURATION_UNITS.MINUTES,
});

// Convert seconds to minutes for DurationInput
const windowInMinutes = computed({
  get() {
    return Math.floor((fairDistributionWindow.value || 0) / 60);
  },
  set(minutes) {
    fairDistributionWindow.value = (Number(minutes) || 0) * 60;
  },
});

// A cap of zero or less would starve every agent, so it is never a valid policy
const isLimitValid = computed(
  () => Number(fairDistributionLimit.value) >= MIN_FAIR_DISTRIBUTION_LIMIT
);

// Anything shorter than the input's own floor cannot be saved, so block the submit
// instead of letting the backend reject it
const isWindowValid = computed(
  () => windowInMinutes.value >= MIN_WINDOW_MINUTES
);

const limitErrorMessage = computed(() =>
  isLimitValid.value
    ? ''
    : t(
        'ASSIGNMENT_POLICY.AGENT_ASSIGNMENT_POLICY.FORM.FAIR_DISTRIBUTION.INPUT_MIN_ERROR',
        { min: MIN_FAIR_DISTRIBUTION_LIMIT }
      )
);

const windowErrorMessage = computed(() =>
  isWindowValid.value
    ? ''
    : t(
        'ASSIGNMENT_POLICY.AGENT_ASSIGNMENT_POLICY.FORM.FAIR_DISTRIBUTION.WINDOW_MIN_ERROR',
        { min: MIN_WINDOW_MINUTES }
      )
);

watch(
  [isLimitValid, isWindowValid],
  () => {
    emit('validationChange', {
      isValid: isLimitValid.value && isWindowValid.value,
      section: 'fairDistribution',
    });
  },
  { immediate: true }
);
</script>

<template>
  <div
    class="flex items-start xl:items-center flex-col md:flex-row gap-4 lg:gap-3 bg-n-solid-1 p-4 outline outline-1 outline-n-weak rounded-xl"
  >
    <div class="flex items-center gap-3">
      <label class="text-sm font-medium text-n-slate-12">
        {{
          t(
            'ASSIGNMENT_POLICY.AGENT_ASSIGNMENT_POLICY.FORM.FAIR_DISTRIBUTION.INPUT_MAX'
          )
        }}
      </label>
      <div class="flex-1">
        <Input
          v-model="fairDistributionLimit"
          type="number"
          :placeholder="`${DEFAULT_FAIR_DISTRIBUTION_LIMIT}`"
          :max="`${MAX_FAIR_DISTRIBUTION_LIMIT}`"
          :message="limitErrorMessage"
          :message-type="isLimitValid ? 'info' : 'error'"
          class="w-full"
        />
      </div>
    </div>

    <div class="flex sm:flex-row flex-col items-start sm:items-center gap-4">
      <label class="text-sm font-medium text-n-slate-12">
        {{
          t(
            'ASSIGNMENT_POLICY.AGENT_ASSIGNMENT_POLICY.FORM.FAIR_DISTRIBUTION.DURATION'
          )
        }}
      </label>

      <div class="flex flex-col gap-1 flex-1">
        <div
          class="flex items-center gap-2 [&>select]:!bg-n-alpha-2 [&>select]:!outline-none [&>select]:hover:brightness-110"
        >
          <DurationInput
            v-model:model-value="windowInMinutes"
            v-model:unit="windowUnit"
            :min="MIN_WINDOW_MINUTES"
            :max="MAX_WINDOW_MINUTES"
          />
        </div>
        <p
          v-if="windowErrorMessage"
          class="mb-0 text-label-small text-n-ruby-9"
        >
          {{ windowErrorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>
