<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Dialog from 'dashboard/components-next/dialog/Dialog.vue';
import Input from 'dashboard/components-next/input/Input.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import { readAvatar } from './avatar';
import { humanizeManualKey } from './templateDefinition';

const props = defineProps({
  slugs: { type: Array, default: () => [] },
  allowAvatar: { type: Boolean, default: false },
});

const emit = defineEmits(['confirm', 'cancel']);

const { t } = useI18n();

const dialogRef = ref(null);
const values = ref({});
const avatar = ref('');
const avatarLoading = ref(false);
const avatarError = ref(false);
let avatarVersion = 0;
let isOpen = false;

const resetAvatar = () => {
  avatarVersion += 1;
  avatar.value = '';
  avatarLoading.value = false;
  avatarError.value = false;
};

const selectAvatar = async event => {
  const [file] = event.target.files;
  event.target.value = '';
  if (!file || !isOpen) return;
  resetAvatar();
  const operation = avatarVersion;
  avatarLoading.value = true;
  try {
    const image = await readAvatar(file);
    if (isOpen && operation === avatarVersion) avatar.value = image;
  } catch {
    if (isOpen && operation === avatarVersion) avatarError.value = true;
  } finally {
    if (operation === avatarVersion) avatarLoading.value = false;
  }
};

const fields = computed(() =>
  props.slugs.map(slug => ({ slug, label: humanizeManualKey(slug) }))
);

const open = () => {
  resetAvatar();
  isOpen = true;
  values.value = Object.fromEntries(props.slugs.map(slug => [slug, '']));
  dialogRef.value.open();
};

// Close silently before emitting a confirmed snapshot. Native dialog close events can
// arrive later, so isOpen also prevents duplicate cancellation or confirmation events.
const close = () => {
  isOpen = false;
  values.value = {};
  resetAvatar();
  dialogRef.value?.close();
};

const onConfirm = () => {
  if (!isOpen || avatarLoading.value || avatarError.value) return;
  const answers = { ...values.value };
  const image = avatar.value;
  close();
  if (props.allowAvatar) emit('confirm', answers, image);
  else emit('confirm', answers);
};

const onClose = () => {
  if (!isOpen) return;
  isOpen = false;
  values.value = {};
  resetAvatar();
  emit('cancel');
};

onBeforeUnmount(() => {
  isOpen = false;
  values.value = {};
  resetAvatar();
});

defineExpose({ open, close });
</script>

<template>
  <Dialog
    ref="dialogRef"
    width="md"
    :title="
      allowAvatar
        ? t('MESSENGER_TEMPLATES.MANUAL_MODAL.PERSONALIZE_TITLE')
        : t('MESSENGER_TEMPLATES.MANUAL_MODAL.TITLE')
    "
    :description="t('MESSENGER_TEMPLATES.MANUAL_MODAL.DESCRIPTION')"
    :confirm-button-label="
      allowAvatar
        ? t('MESSENGER_TEMPLATES.MANUAL_MODAL.DOWNLOAD')
        : t('MESSENGER_TEMPLATES.MANUAL_MODAL.CONTINUE')
    "
    :is-loading="avatarLoading"
    :disable-confirm-button="avatarLoading || avatarError"
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
      <div v-if="allowAvatar" class="space-y-2">
        <label
          for="messenger-export-avatar"
          class="mb-0 block text-sm font-medium text-n-slate-12"
        >
          {{ t('MESSENGER_TEMPLATES.MANUAL_MODAL.AVATAR') }}
        </label>
        <input
          id="messenger-export-avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-describedby="messenger-export-avatar-hint messenger-export-avatar-scope"
          :aria-invalid="avatarError"
          class="w-full min-w-0 text-xs text-n-slate-11 file:mr-2 file:rounded-lg file:border-0 file:bg-n-alpha-2 file:px-3 file:py-2 file:text-n-slate-12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-n-brand"
          @change="selectAvatar"
        />
        <p
          id="messenger-export-avatar-hint"
          class="mb-0 text-xs text-n-slate-11"
        >
          {{ t('MESSENGER_SIMULATOR.AVATAR_HINT') }}
        </p>
        <p
          id="messenger-export-avatar-scope"
          class="mb-0 text-xs text-n-slate-11"
        >
          {{ t('MESSENGER_TEMPLATES.MANUAL_MODAL.AVATAR_HINT') }}
        </p>
        <p
          v-if="avatarLoading"
          role="status"
          class="mb-0 text-xs text-n-slate-11"
        >
          {{ t('MESSENGER_TEMPLATES.MANUAL_MODAL.AVATAR_LOADING') }}
        </p>
        <p v-if="avatarError" role="alert" class="mb-0 text-xs text-n-ruby-11">
          {{ t('MESSENGER_SIMULATOR.AVATAR_ERROR') }}
        </p>
        <div
          v-if="avatar || avatarLoading || avatarError"
          class="flex items-center gap-3"
        >
          <img
            v-if="avatar"
            :src="avatar"
            :alt="t('MESSENGER_TEMPLATES.MANUAL_MODAL.AVATAR_PREVIEW')"
            class="size-12 rounded-full object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            color="slate"
            size="sm"
            :label="t('MESSENGER_TEMPLATES.MANUAL_MODAL.RESET_AVATAR')"
            @click="resetAvatar"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>
