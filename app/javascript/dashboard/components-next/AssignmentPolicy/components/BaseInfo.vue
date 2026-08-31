<script setup>
import { computed, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, minLength } from '@vuelidate/validators';

import WithLabel from 'v3/components/Form/WithLabel.vue';
import Input from 'dashboard/components-next/input/Input.vue';
import Switch from 'dashboard/components-next/switch/Switch.vue';

defineProps({
  nameLabel: {
    type: String,
    default: '',
  },
  namePlaceholder: {
    type: String,
    default: '',
  },
  descriptionLabel: {
    type: String,
    default: '',
  },
  descriptionPlaceholder: {
    type: String,
    default: '',
  },
  statusLabel: {
    type: String,
    default: '',
  },
  statusPlaceholder: {
    type: String,
    default: '',
  },
  nameError: {
    type: String,
    default: '',
  },
  descriptionError: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['validationChange']);

const policyName = defineModel('policyName', {
  type: String,
  default: '',
});

const description = defineModel('description', {
  type: String,
  default: '',
});

const enabled = defineModel('enabled', {
  type: Boolean,
  default: true,
});

const validationRules = {
  policyName: { required, minLength: minLength(1) },
  description: { required, minLength: minLength(1) },
};

const v$ = useVuelidate(validationRules, { policyName, description });

const isValid = computed(() => !v$.value.$invalid);

// Only complain once the field has been visited, so a fresh form isn't red on arrival
const hasNameError = computed(() => v$.value.policyName.$error);
const hasDescriptionError = computed(() => v$.value.description.$error);

watch(
  isValid,
  () => {
    emit('validationChange', {
      isValid: isValid.value,
      section: 'baseInfo',
    });
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex flex-col gap-4 pb-4">
    <!-- Policy Name Field -->
    <div class="flex items-center gap-6">
      <WithLabel
        :label="nameLabel"
        name="policyName"
        :has-error="hasNameError"
        :error-message="nameError"
        class="flex items-center w-full [&>label]:min-w-[120px]"
      >
        <div class="flex-1">
          <Input
            v-model="policyName"
            type="text"
            :placeholder="namePlaceholder"
            @blur="v$.policyName.$touch()"
          />
        </div>
      </WithLabel>
    </div>

    <!-- Description Field -->
    <div class="flex items-center gap-6">
      <WithLabel
        :label="descriptionLabel"
        name="description"
        :has-error="hasDescriptionError"
        :error-message="descriptionError"
        class="flex items-center w-full [&>label]:min-w-[120px]"
      >
        <div class="flex-1">
          <Input
            v-model="description"
            type="text"
            :placeholder="descriptionPlaceholder"
            @blur="v$.description.$touch()"
          />
        </div>
      </WithLabel>
    </div>

    <!-- Status Field -->
    <div v-if="statusLabel" class="flex items-center gap-6">
      <WithLabel
        :label="statusLabel"
        name="enabled"
        class="flex items-center w-full [&>label]:min-w-[120px]"
      >
        <div class="flex items-center gap-2">
          <Switch v-model="enabled" />
          <span class="text-sm text-n-slate-11">
            {{ statusPlaceholder }}
          </span>
        </div>
      </WithLabel>
    </div>
  </div>
</template>
