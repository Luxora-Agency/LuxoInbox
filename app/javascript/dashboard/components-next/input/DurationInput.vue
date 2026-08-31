<script setup>
import { computed, ref } from 'vue';
import Input from './Input.vue';
import { useI18n } from 'vue-i18n';
import { DURATION_UNITS } from './constants';

const props = defineProps({
  min: { type: Number, default: 0 },
  max: { type: Number, default: Infinity },
  disabled: { type: Boolean, default: false },
  // Fields backed by whole hours have nothing to gain from a minutes option, so they
  // can narrow the list instead of offering a unit their storage cannot round-trip
  units: {
    type: Array,
    default: () => Object.values(DURATION_UNITS),
    validator: value =>
      value.every(u => Object.values(DURATION_UNITS).includes(u)),
  },
});

const MINUTES_PER_UNIT = {
  [DURATION_UNITS.MINUTES]: 1,
  [DURATION_UNITS.HOURS]: 60,
  [DURATION_UNITS.DAYS]: 24 * 60,
};

const { t } = useI18n();
const duration = defineModel('modelValue', { type: Number, default: null });
const unit = defineModel('unit', {
  type: String,
  default: DURATION_UNITS.MINUTES,
  validate(value) {
    return Object.values(DURATION_UNITS).includes(value);
  },
});

const unitOptions = computed(() =>
  Object.values(DURATION_UNITS).filter(value => props.units.includes(value))
);

const unitLabels = {
  [DURATION_UNITS.MINUTES]: 'DURATION_INPUT.MINUTES',
  [DURATION_UNITS.HOURS]: 'DURATION_INPUT.HOURS',
  [DURATION_UNITS.DAYS]: 'DURATION_INPUT.DAYS',
};

// Raw keystrokes win while the field has focus. Rounding and clamping wait for blur so a
// half-typed number is never rewritten to 0 under the cursor.
const draft = ref(null);
const isEditing = ref(false);

const minutesPerUnit = computed(() => MINUTES_PER_UNIT[unit.value] ?? 1);

// A coarse unit cannot always express the stored value (60 minutes is 0.04 days). Show the
// nearest whole unit rather than a misleading 0 and leave the stored value alone until the
// user actually types a new number.
const nearestRepresentable = minutes => {
  const exact = minutes / minutesPerUnit.value;
  if (exact === 0) return 0;

  return Math.max(1, Math.round(exact));
};

const displayValue = computed({
  get() {
    if (isEditing.value) return draft.value;
    if (duration.value == null) return null;

    return nearestRepresentable(duration.value);
  },
  set(value) {
    draft.value = value;
    if (value == null || value === '') {
      duration.value = null;
      return;
    }

    duration.value = Number(value) * minutesPerUnit.value;
  },
});

const handleFocus = () => {
  draft.value =
    duration.value == null ? null : nearestRepresentable(duration.value);
  isEditing.value = true;
};

// Settle the value once the user is done: whole minutes, inside the allowed range
const normalizeDuration = () => {
  isEditing.value = false;
  draft.value = null;
  if (duration.value == null) return;

  const rounded = Math.round(duration.value);
  duration.value = Math.min(Math.max(rounded, props.min), props.max);
};
</script>

<template>
  <Input
    v-model="displayValue"
    type="number"
    autocomplete="off"
    :disabled="disabled"
    :placeholder="t('DURATION_INPUT.PLACEHOLDER')"
    class="flex-grow w-full"
    @focus="handleFocus"
    @blur="normalizeDuration"
    @keydown.enter="normalizeDuration"
  />
  <select
    v-model="unit"
    :disabled="disabled"
    class="mb-0 text-sm disabled:outline-n-weak disabled:opacity-40"
  >
    <option v-for="value in unitOptions" :key="value" :value="value">
      {{ t(unitLabels[value]) }}
    </option>
  </select>
</template>
