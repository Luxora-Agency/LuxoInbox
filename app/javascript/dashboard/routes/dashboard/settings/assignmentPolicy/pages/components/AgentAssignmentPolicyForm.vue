<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useDebounceFn } from '@vueuse/core';
import { useMapGetter } from 'dashboard/composables/store';
import BaseInfo from 'dashboard/components-next/AssignmentPolicy/components/BaseInfo.vue';
import RadioCard from 'dashboard/components-next/radioCard/RadioCard.vue';
import FairDistribution from 'dashboard/components-next/AssignmentPolicy/components/FairDistribution.vue';
import DataTable from 'dashboard/components-next/AssignmentPolicy/components/DataTable.vue';
import AddDataDropdown from 'dashboard/components-next/AssignmentPolicy/components/AddDataDropdown.vue';
import DurationInput from 'dashboard/components-next/input/DurationInput.vue';
import { DURATION_UNITS } from 'dashboard/components-next/input/constants';
import WithLabel from 'v3/components/Form/WithLabel.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import {
  OPTIONS,
  ROUND_ROBIN,
  EARLIEST_CREATED,
  DEFAULT_FAIR_DISTRIBUTION_LIMIT,
  DEFAULT_FAIR_DISTRIBUTION_WINDOW,
  DEFAULT_EXCLUDE_OLDER_THAN_HOURS,
} from 'dashboard/routes/dashboard/settings/assignmentPolicy/constants';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      name: '',
      description: '',
      assignmentOrder: ROUND_ROBIN,
      conversationPriority: EARLIEST_CREATED,
      fairDistributionLimit: DEFAULT_FAIR_DISTRIBUTION_LIMIT,
      fairDistributionWindow: DEFAULT_FAIR_DISTRIBUTION_WINDOW,
      excludeOlderThanHours: DEFAULT_EXCLUDE_OLDER_THAN_HOURS,
    }),
  },
  mode: {
    type: String,
    required: true,
    validator: value => ['CREATE', 'EDIT'].includes(value),
  },
  policyInboxes: {
    type: Array,
    default: () => [],
  },
  inboxList: {
    type: Array,
    default: () => [],
  },
  showInboxSection: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isInboxLoading: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits([
  'submit',
  'change',
  'addInbox',
  'deleteInbox',
  'navigateToInbox',
]);
// Duration limits for the stale-conversation threshold: 1 hour to 999 days (in minutes)
const MIN_EXCLUSION_MINUTES = 60;
const MAX_EXCLUSION_MINUTES = 1438560;
// The threshold is stored in whole hours, so minutes would not round-trip
const EXCLUSION_UNIT_OPTIONS = [DURATION_UNITS.HOURS, DURATION_UNITS.DAYS];

const { t } = useI18n();
const route = useRoute();

const accountId = computed(() => Number(route.params.accountId));
const isFeatureEnabledonAccount = useMapGetter(
  'accounts/isFeatureEnabledonAccount'
);

const BASE_KEY = 'ASSIGNMENT_POLICY.AGENT_ASSIGNMENT_POLICY';

const state = reactive({
  name: '',
  description: '',
  enabled: true,
  assignmentOrder: ROUND_ROBIN,
  conversationPriority: EARLIEST_CREATED,
  fairDistributionLimit: DEFAULT_FAIR_DISTRIBUTION_LIMIT,
  fairDistributionWindow: DEFAULT_FAIR_DISTRIBUTION_WINDOW,
  excludeOlderThanHours: DEFAULT_EXCLUDE_OLDER_THAN_HOURS,
});

// Every section that can block submission reports here; the form is valid once all agree
const sectionValidity = reactive({
  baseInfo: false,
  fairDistribution: true,
});

const isFormValid = computed(() =>
  Object.values(sectionValidity).every(Boolean)
);

const exclusionUnit = ref(DURATION_UNITS.DAYS);
const windowUnit = ref(DURATION_UNITS.HOURS);

// DurationInput works in minutes; the policy stores hours, so bridge the two
const excludeOlderThanMinutes = computed({
  get() {
    return state.excludeOlderThanHours == null
      ? null
      : state.excludeOlderThanHours * 60;
  },
  set(minutes) {
    state.excludeOlderThanHours =
      minutes == null ? null : Math.round(minutes / 60);
  },
});

const createOption = (
  type,
  key,
  stateKey,
  disabled = false,
  disabledMessage = '',
  disabledLabel = ''
) => ({
  key,
  label: t(`${BASE_KEY}.FORM.${type}.${key.toUpperCase()}.LABEL`),
  description: t(`${BASE_KEY}.FORM.${type}.${key.toUpperCase()}.DESCRIPTION`),
  isActive: state[stateKey] === key,
  disabled,
  disabledMessage,
  disabledLabel,
});

const assignmentOrderOptions = computed(() => {
  const hasAdvancedAssignment = isFeatureEnabledonAccount.value(
    accountId.value,
    'advanced_assignment'
  );

  return OPTIONS.ORDER.map(key => {
    const isBalanced = key === 'balanced';
    const disabled = isBalanced && !hasAdvancedAssignment;
    const disabledMessage = disabled
      ? t(`${BASE_KEY}.FORM.ASSIGNMENT_ORDER.BALANCED.PREMIUM_MESSAGE`)
      : '';
    const disabledLabel = disabled
      ? t(`${BASE_KEY}.FORM.ASSIGNMENT_ORDER.BALANCED.PREMIUM_BADGE`)
      : '';

    return createOption(
      'ASSIGNMENT_ORDER',
      key,
      'assignmentOrder',
      disabled,
      disabledMessage,
      disabledLabel
    );
  });
});

const assignmentPriorityOptions = computed(() =>
  OPTIONS.PRIORITY.map(key =>
    createOption('ASSIGNMENT_PRIORITY', key, 'conversationPriority')
  )
);

const radioSections = computed(() => [
  {
    key: 'assignmentOrder',
    label: t(`${BASE_KEY}.FORM.ASSIGNMENT_ORDER.LABEL`),
    options: assignmentOrderOptions.value,
  },
  {
    key: 'conversationPriority',
    label: t(`${BASE_KEY}.FORM.ASSIGNMENT_PRIORITY.LABEL`),
    options: assignmentPriorityOptions.value,
  },
]);

const buttonLabel = computed(() =>
  t(`${BASE_KEY}.${props.mode.toUpperCase()}.${props.mode}_BUTTON`)
);

const statusHint = computed(() =>
  t(`${BASE_KEY}.FORM.STATUS.${state.enabled ? 'ACTIVE' : 'INACTIVE'}`)
);

const handleValidationChange = ({ isValid, section }) => {
  sectionValidity[section] = isValid;
};

const resetForm = () => {
  Object.assign(state, {
    name: '',
    description: '',
    enabled: true,
    assignmentOrder: ROUND_ROBIN,
    conversationPriority: EARLIEST_CREATED,
    fairDistributionLimit: DEFAULT_FAIR_DISTRIBUTION_LIMIT,
    fairDistributionWindow: DEFAULT_FAIR_DISTRIBUTION_WINDOW,
    excludeOlderThanHours: DEFAULT_EXCLUDE_OLDER_THAN_HOURS,
  });
};

const handleSubmit = () => {
  emit('submit', { ...state });
};

// Pick the display unit from the stored value so non-day thresholds (e.g. 25h) don't get floored
const detectExclusionUnit = hours => {
  exclusionUnit.value =
    hours && hours % 24 !== 0 ? DURATION_UNITS.HOURS : DURATION_UNITS.DAYS;
};

// Same idea for the fair-distribution window, which the policy stores in seconds
const detectWindowUnit = seconds => {
  const minutes = Math.floor((Number(seconds) || 0) / 60);
  if (minutes && minutes % (24 * 60) === 0) {
    windowUnit.value = DURATION_UNITS.DAYS;
  } else if (minutes && minutes % 60 === 0) {
    windowUnit.value = DURATION_UNITS.HOURS;
  } else {
    windowUnit.value = DURATION_UNITS.MINUTES;
  }
};

watch(
  () => props.initialData,
  newData => {
    Object.assign(state, newData);
    detectExclusionUnit(newData.excludeOlderThanHours);
    detectWindowUnit(newData.fairDistributionWindow);
  },
  { immediate: true, deep: true }
);

// Surface the working copy so the page can explain the pipeline with live values.
// Debounced so the diagram is not rebuilt on every keystroke.
const emitChange = useDebounceFn(() => emit('change', { ...state }), 150);

watch(state, emitChange, { immediate: true });

defineExpose({
  resetForm,
});
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="flex flex-col gap-4 divide-y divide-n-weak mb-4">
      <BaseInfo
        v-model:policy-name="state.name"
        v-model:description="state.description"
        v-model:enabled="state.enabled"
        :name-label="t(`${BASE_KEY}.FORM.NAME.LABEL`)"
        :name-placeholder="t(`${BASE_KEY}.FORM.NAME.PLACEHOLDER`)"
        :description-label="t(`${BASE_KEY}.FORM.DESCRIPTION.LABEL`)"
        :description-placeholder="t(`${BASE_KEY}.FORM.DESCRIPTION.PLACEHOLDER`)"
        :status-label="t(`${BASE_KEY}.FORM.STATUS.LABEL`)"
        :status-placeholder="statusHint"
        :name-error="t(`${BASE_KEY}.FORM.NAME.ERROR`)"
        :description-error="t(`${BASE_KEY}.FORM.DESCRIPTION.ERROR`)"
        @validation-change="handleValidationChange"
      />

      <div class="flex flex-col items-center">
        <div
          v-for="section in radioSections"
          :key="section.key"
          class="py-4 flex flex-col items-start gap-3 w-full"
        >
          <WithLabel
            :label="section.label"
            name="assignmentPolicy"
            class="w-full flex items-start flex-col gap-3"
          >
            <div class="grid grid-cols-1 xs:grid-cols-2 gap-4 w-full">
              <RadioCard
                v-for="option in section.options"
                :id="option.key"
                :key="option.key"
                :label="option.label"
                :description="option.description"
                :is-active="option.isActive"
                :disabled="option.disabled"
                :disabled-label="option.disabledLabel"
                :disabled-message="option.disabledMessage"
                @select="state[section.key] = $event"
              />
            </div>
          </WithLabel>
        </div>
      </div>

      <div class="pt-4 pb-2 flex-col flex gap-4">
        <div class="flex flex-col items-start gap-1 py-1">
          <label class="text-sm font-medium text-n-slate-12 py-1">
            {{ t(`${BASE_KEY}.FORM.FAIR_DISTRIBUTION.LABEL`) }}
          </label>
          <p class="mb-0 text-n-slate-11 text-sm">
            {{ t(`${BASE_KEY}.FORM.FAIR_DISTRIBUTION.DESCRIPTION`) }}
          </p>
        </div>
        <FairDistribution
          v-model:fair-distribution-limit="state.fairDistributionLimit"
          v-model:fair-distribution-window="state.fairDistributionWindow"
          v-model:window-unit="windowUnit"
          @validation-change="handleValidationChange"
        />
      </div>

      <div class="pt-4 pb-2 flex-col flex gap-4">
        <div class="flex flex-col items-start gap-1 py-1">
          <label class="text-sm font-medium text-n-slate-12 py-1">
            {{ t(`${BASE_KEY}.FORM.EXCLUDE_OLDER_THAN.LABEL`) }}
          </label>
          <p class="mb-0 text-n-slate-11 text-sm">
            {{ t(`${BASE_KEY}.FORM.EXCLUDE_OLDER_THAN.DESCRIPTION`) }}
          </p>
        </div>
        <div
          class="flex items-center gap-2 [&>select]:!bg-n-alpha-2 [&>select]:!outline-none [&>select]:hover:brightness-110"
        >
          <DurationInput
            v-model:unit="exclusionUnit"
            v-model:model-value="excludeOlderThanMinutes"
            :units="EXCLUSION_UNIT_OPTIONS"
            :min="MIN_EXCLUSION_MINUTES"
            :max="MAX_EXCLUSION_MINUTES"
          />
        </div>
      </div>
    </div>

    <Button
      type="submit"
      :label="buttonLabel"
      :disabled="!isFormValid || isLoading"
      :is-loading="isLoading"
    />

    <div
      v-if="showInboxSection"
      class="py-4 flex-col flex gap-4 border-t border-n-weak mt-6"
    >
      <div class="flex items-end gap-4 w-full justify-between">
        <div class="flex flex-col items-start gap-1 py-1">
          <label class="text-sm font-medium text-n-slate-12 py-1">
            {{ t(`${BASE_KEY}.FORM.INBOXES.LABEL`) }}
          </label>
          <p class="mb-0 text-n-slate-11 text-sm">
            {{ t(`${BASE_KEY}.FORM.INBOXES.DESCRIPTION`) }}
          </p>
        </div>
        <AddDataDropdown
          :label="t(`${BASE_KEY}.FORM.INBOXES.ADD_BUTTON`)"
          :search-placeholder="
            t(`${BASE_KEY}.FORM.INBOXES.DROPDOWN.SEARCH_PLACEHOLDER`)
          "
          :items="inboxList"
          @add="$emit('addInbox', $event)"
        />
      </div>
      <DataTable
        :items="policyInboxes"
        :is-fetching="isInboxLoading"
        :empty-state-message="t(`${BASE_KEY}.FORM.INBOXES.EMPTY_STATE`)"
        @delete="$emit('deleteInbox', $event)"
        @navigate="$emit('navigateToInbox', $event)"
      />
    </div>
  </form>
</template>
