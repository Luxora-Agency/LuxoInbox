<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Dialog from 'dashboard/components-next/dialog/Dialog.vue';
import Input from 'dashboard/components-next/input/Input.vue';
import { humanizeManualKey } from './templateDefinition';

const props = defineProps({
  slugs: { type: Array, default: () => [] },
});

const emit = defineEmits(['confirm', 'cancel']);

const { t } = useI18n();

const dialogRef = ref(null);
const values = ref({});
// `Dialog.close()` emits `close` whether the agent cancelled or confirmed, so this
// tells the two apart instead of reporting a cancellation right after a confirmation.
let isConfirming = false;

const fields = computed(() =>
  props.slugs.map(slug => ({ slug, label: humanizeManualKey(slug) }))
);

const open = () => {
  isConfirming = false;
  values.value = Object.fromEntries(props.slugs.map(slug => [slug, '']));
  dialogRef.value.open();
};

const onConfirm = () => {
  isConfirming = true;
  dialogRef.value.close();
  emit('confirm', { ...values.value });
};

const onClose = () => {
  if (isConfirming) {
    isConfirming = false;
    return;
  }
  emit('cancel');
};

defineExpose({ open });
</script>

<template>
  <Dialog
    ref="dialogRef"
    width="md"
    :title="t('MESSENGER_TEMPLATES.MANUAL_MODAL.TITLE')"
    :description="t('MESSENGER_TEMPLATES.MANUAL_MODAL.DESCRIPTION')"
    :confirm-button-label="t('MESSENGER_TEMPLATES.MANUAL_MODAL.CONTINUE')"
    :cancel-button-label="t('MESSENGER_TEMPLATES.MANUAL_MODAL.CANCEL')"
    @confirm="onConfirm"
    @close="onClose"
  >
    <div class="flex flex-col gap-3">
      <Input
        v-for="(field, index) in fields"
        :id="`messenger-manual-value-${field.slug}`"
        :key="field.slug"
        v-model="values[field.slug]"
        :label="field.label"
        :maxlength="500"
        :autofocus="index === 0"
      />
    </div>
  </Dialog>
</template>
