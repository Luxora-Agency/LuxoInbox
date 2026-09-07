<script setup>
import { computed, ref, nextTick, onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { authorizeMessengerSimulator } from 'dashboard/api/messengerSimulator';
import { listMessengerTemplateVariables } from 'dashboard/api/messengerTemplates';
import { useStore } from 'dashboard/composables/store';
import Button from 'dashboard/components-next/button/Button.vue';
import Input from 'dashboard/components-next/input/Input.vue';
import MessengerSimulatorPreview from './MessengerSimulatorPreview.vue';
import { readAvatar } from './avatar';
import {
  buildAgentContext,
  buildSampleContact,
  buildVariableCatalog,
  resolveMessengerTemplate,
  splitDisplayName,
  validateTemplateVariables,
} from './templateDefinition';
import MessengerVariablePicker from './MessengerVariablePicker.vue';
import MessengerScreenshotRenderer from './MessengerScreenshotRenderer.vue';

const props = defineProps({
  accountId: { type: Number, required: true },
  initialDefinition: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['accessDenied']);
const avatarSource = ref(props.initialDefinition?.avatar || 'contact');
const { t } = useI18n();
const MAX_MESSAGES = 30;
const participants = ref({
  incoming: {
    name: t('MESSENGER_SIMULATOR.EXAMPLE_INCOMING_NAME'),
    avatar: '',
  },
  outgoing: {
    name:
      props.initialDefinition?.business_name ||
      t('MESSENGER_SIMULATOR.EXAMPLE_OUTGOING_NAME'),
    avatar: '',
  },
});
let messageId = 2;
const exampleMessages = () => [
  {
    id: 1,
    sender: 'incoming',
    text: t('MESSENGER_SIMULATOR.EXAMPLE_INCOMING_MESSAGE'),
    time: '',
  },
  {
    id: 2,
    sender: 'outgoing',
    text: t('MESSENGER_SIMULATOR.EXAMPLE_OUTGOING_MESSAGE'),
    time: '',
  },
];
const messages = ref(
  (props.initialDefinition?.messages || []).map((message, index) => ({
    ...message,
    id: index + 1,
  }))
);
messageId = Math.max(messageId, messages.value.length);
const loadExample = () => {
  messages.value = exampleMessages();
};
const rendererRef = ref(null);
const composerRef = ref(null);
const composerBoxRef = ref(null);
const editingId = ref(null);
const showTime = ref(false);
const draft = ref({ sender: 'incoming', text: '', time: '' });
const previewMessages = computed(() => {
  if (!draft.value.text.trim()) return messages.value;
  if (editingId.value !== null) {
    return messages.value.map(message =>
      message.id === editingId.value ? { ...message, ...draft.value } : message
    );
  }
  if (messages.value.length >= MAX_MESSAGES) return messages.value;
  return [...messages.value, { id: 'draft', ...draft.value }];
});
const templateDefinition = computed(() => ({
  version: 1,
  business_name: participants.value.outgoing.name,
  avatar: avatarSource.value,
  messages: previewMessages.value.map(({ sender, text, time }) => ({
    sender,
    text,
    time,
  })),
}));
const store = useStore();
const customAttributes = computed(
  () => store?.getters['attributes/getAttributes'] ?? []
);
const currentUser = computed(() => store?.getters.getCurrentUser ?? {});
// Static keys stay server-owned so the allowlist is never duplicated on the client.
// Settings loads them into the store; the simulator fetches them on its own.
const fetchedVariables = ref([]);
const storeVariables = computed(
  () => store?.getters['messengerTemplates/getVariables'] ?? []
);
const serverVariables = computed(() =>
  storeVariables.value.length ? storeVariables.value : fetchedVariables.value
);
const variableLoadError = ref(false);
const variableCatalog = computed(() =>
  buildVariableCatalog(serverVariables.value, customAttributes.value, t)
);
const allowedVariableKeys = computed(() =>
  variableCatalog.value.map(entry => entry.key)
);
// Without the server catalog there is no allowlist to mirror, so authoring is not
// blocked here; the server still rejects unknown variables on save.
const variableErrors = computed(() => {
  if (!props.initialDefinition || !serverVariables.value.length) return [];
  const definition = templateDefinition.value;
  return [
    definition.business_name,
    ...definition.messages.flatMap(message => [message.text, message.time]),
  ]
    .flatMap(text => validateTemplateVariables(text, allowedVariableKeys.value))
    .filter((token, index, tokens) => tokens.indexOf(token) === index);
});
// The preview contact is one identity: the name shown in the bubble header also drives
// `{{contact.first_name}}` and `{{contact.last_name}}`, split like the server presenter.
const previewContext = computed(() => ({
  contact: {
    ...buildSampleContact(variableCatalog.value),
    ...splitDisplayName(participants.value.incoming.name),
    avatar_data: participants.value.incoming.avatar,
  },
  agent: buildAgentContext(currentUser.value),
}));
const renderedContent = computed(() =>
  props.initialDefinition
    ? resolveMessengerTemplate(templateDefinition.value, previewContext.value)
    : { participants: participants.value, messages: previewMessages.value }
);
const variableLimit = ref(false);
const showVariablePicker = ref(false);
const variableAnchor = ref(null);

const CARET_MIRROR_STYLES = [
  'boxSizing',
  'width',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'lineHeight',
  'textIndent',
  'textTransform',
  'wordSpacing',
];

// A textarea exposes no caret coordinates, so an off-screen mirror of the text before
// the caret gives the line offset the picker anchors to, relative to the composer box.
const measureCaret = () => {
  const input = composerRef.value;
  const box = composerBoxRef.value;
  if (!input || !box) return null;
  const styles = window.getComputedStyle(input);
  const mirror = document.createElement('div');
  CARET_MIRROR_STYLES.forEach(name => {
    mirror.style[name] = styles[name];
  });
  mirror.style.position = 'absolute';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';
  mirror.style.height = 'auto';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.overflowWrap = 'break-word';
  mirror.textContent = input.value.slice(0, input.selectionStart);
  const caret = document.createElement('span');
  caret.textContent = '\u200b';
  mirror.appendChild(caret);
  document.body.appendChild(mirror);
  const caretTop = caret.offsetTop;
  mirror.remove();
  const inputRect = input.getBoundingClientRect();
  const boxRect = box.getBoundingClientRect();
  return {
    top: inputRect.top - boxRect.top + caretTop - input.scrollTop,
    height: parseFloat(styles.lineHeight) || input.clientHeight,
  };
};

const openVariablePicker = () => {
  variableAnchor.value = measureCaret();
  showVariablePicker.value = true;
};

const insertVariable = async token => {
  showVariablePicker.value = false;
  const input = composerRef.value;
  if (!input || input.disabled) return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text =
    draft.value.text.slice(0, start) + token + draft.value.text.slice(end);
  variableLimit.value = text.length > 500;
  if (variableLimit.value) return;
  draft.value.text = text;
  await nextTick();
  input.focus();
  input.setSelectionRange(start + token.length, start + token.length);
};
const canSubmit = computed(
  () =>
    draft.value.text.trim() &&
    (editingId.value !== null || messages.value.length < MAX_MESSAGES)
);
const isExporting = ref(false);
const avatarLoading = ref({ incoming: false, outgoing: false });
const avatarVersions = { incoming: 0, outgoing: 0 };
const errorKey = ref('');
const success = ref(false);
const exportedParts = ref(1);
let isActive = true;
const isLoadingAvatar = computed(() =>
  Object.values(avatarLoading.value).some(Boolean)
);
const isValid = computed(
  () =>
    Object.values(participants.value).every(person => person.name.trim()) &&
    (editingId.value === null || Boolean(draft.value.text.trim())) &&
    (!draft.value.text.trim() || Boolean(canSubmit.value)) &&
    previewMessages.value.length > 0 &&
    previewMessages.value.every(message => message.text.trim()) &&
    variableErrors.value.length === 0
);
const participantLabels = computed(() => ({
  incoming: t('MESSENGER_SIMULATOR.INCOMING'),
  outgoing: props.initialDefinition
    ? t('MESSENGER_SIMULATOR.TEMPLATES.BUSINESS_NAME')
    : t('MESSENGER_SIMULATOR.OUTGOING'),
}));
// In template mode the contact comes from the conversation at export time, so only the
// business name is authored here.
const editableParticipants = computed(() =>
  props.initialDefinition
    ? { outgoing: participants.value.outgoing }
    : participants.value
);
const exportLabel = computed(() => {
  if (isExporting.value) return t('MESSENGER_SIMULATOR.EXPORTING');
  return props.initialDefinition
    ? t('MESSENGER_SIMULATOR.TEMPLATES.DOWNLOAD_SAMPLE')
    : t('MESSENGER_SIMULATOR.EXPORT');
});
const errorMessage = computed(
  () =>
    ({
      avatar: t('MESSENGER_SIMULATOR.AVATAR_ERROR'),
      export: t('MESSENGER_SIMULATOR.EXPORT_ERROR'),
      limit: t('MESSENGER_SIMULATOR.EXPORT_LIMIT'),
    })[errorKey.value]
);
const senderOptions = computed(() =>
  Object.entries(participants.value).map(([value, person]) => ({
    value,
    label: person.name || participantLabels.value[value],
  }))
);

const resetComposer = () => {
  editingId.value = null;
  draft.value = { sender: draft.value.sender, text: '', time: '' };
  showTime.value = false;
};

const commitMessage = () => {
  if (!canSubmit.value) return;
  if (editingId.value !== null) {
    const index = messages.value.findIndex(
      message => message.id === editingId.value
    );
    messages.value[index] = { id: editingId.value, ...draft.value };
  } else {
    messageId += 1;
    messages.value.push({ id: messageId, ...draft.value });
  }
  resetComposer();
  success.value = false;
};

const saveMessage = async () => {
  if (isExporting.value) return;
  commitMessage();
  await nextTick();
  composerRef.value?.focus();
};

const editMessage = async message => {
  if (isExporting.value || editingId.value === message.id) return;
  // Keep an in-progress message when switching to another row.
  if (canSubmit.value) await saveMessage();
  editingId.value = message.id;
  draft.value = {
    sender: message.sender,
    text: message.text,
    time: message.time,
  };
  showTime.value = Boolean(message.time);
  await nextTick();
  composerRef.value?.focus();
};

const deleteMessage = index => {
  if (messages.value[index].id === editingId.value) resetComposer();
  messages.value.splice(index, 1);
  success.value = false;
};

const onComposerKeydown = event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    saveMessage();
  }
};

const moveMessage = (index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= messages.value.length) return;
  const [message] = messages.value.splice(index, 1);
  messages.value.splice(target, 0, message);
};

const selectAvatar = async (sender, event) => {
  const [file] = event.target.files;
  event.target.value = '';
  if (!file) return;
  avatarVersions[sender] += 1;
  const version = avatarVersions[sender];
  avatarLoading.value[sender] = true;
  errorKey.value = '';
  try {
    const avatar = await readAvatar(file);
    if (isActive && version === avatarVersions[sender]) {
      participants.value[sender].avatar = avatar;
    }
  } catch {
    if (isActive && version === avatarVersions[sender]) {
      errorKey.value = 'avatar';
    }
  } finally {
    if (version === avatarVersions[sender]) avatarLoading.value[sender] = false;
  }
};

const exportImage = async () => {
  if (
    !isActive ||
    isExporting.value ||
    isLoadingAvatar.value ||
    !isValid.value
  ) {
    return;
  }
  const requestedAccount = props.accountId;
  const stillActive = () => isActive && props.accountId === requestedAccount;
  isExporting.value = true;
  commitMessage();
  errorKey.value = '';
  success.value = false;
  try {
    exportedParts.value = await rendererRef.value.download({
      participants: renderedContent.value.participants,
      messages: renderedContent.value.messages.map(message => ({ ...message })),
      authorize: () => authorizeMessengerSimulator(requestedAccount),
      isCurrent: stillActive,
      filename: `messenger-simulation-${requestedAccount}`,
    });
    success.value = true;
  } catch (error) {
    if (!stillActive()) return;
    if ([401, 403, 404].includes(error.response?.status)) {
      emit('accessDenied');
    } else {
      errorKey.value = error.message === 'limit' ? 'limit' : 'export';
    }
  } finally {
    if (stillActive()) isExporting.value = false;
  }
};

defineExpose({
  getSnapshot: () =>
    JSON.stringify({
      participants: participants.value,
      messages: previewMessages.value,
      avatar: avatarSource.value,
    }),
  getDefinition: () => (isValid.value ? templateDefinition.value : null),
  getValidationErrors: () => [...variableErrors.value],
});

onMounted(async () => {
  if (!props.initialDefinition || storeVariables.value.length) return;
  try {
    const { data } = await listMessengerTemplateVariables(props.accountId);
    if (isActive) fetchedVariables.value = data || [];
  } catch {
    fetchedVariables.value = [];
    variableLoadError.value = true;
  }
});

onBeforeUnmount(() => {
  isActive = false;
});
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col">
    <div
      class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-n-weak bg-n-solid-1 px-5 py-3 lg:px-8"
    >
      <p
        v-if="!initialDefinition"
        class="mb-0 max-w-prose text-xs text-n-slate-11"
      >
        {{ t('MESSENGER_SIMULATOR.LOCAL_ONLY') }}
      </p>
      <Button
        icon="i-lucide-download"
        :label="exportLabel"
        :disabled="disabled || isExporting || isLoadingAvatar || !isValid"
        :is-loading="isExporting"
        @click="exportImage"
      />
    </div>
    <div v-if="errorKey || success || !isValid" class="px-5 pt-3 lg:px-8">
      <p v-if="errorKey" role="alert" class="mb-0 text-sm text-n-ruby-11">
        {{ errorMessage }}
      </p>
      <ul
        v-else-if="variableErrors.length"
        role="alert"
        class="m-0 list-none space-y-1 p-0 text-sm text-n-ruby-11"
      >
        <li v-for="token in variableErrors" :key="token">
          {{ t('MESSENGER_TEMPLATES.VARIABLES.UNKNOWN', { token }) }}
        </li>
      </ul>
      <p
        v-else-if="!isValid"
        role="status"
        class="mb-0 text-sm text-n-slate-11"
      >
        {{
          initialDefinition
            ? t('MESSENGER_SIMULATOR.TEMPLATES.VALIDATION')
            : t('MESSENGER_SIMULATOR.VALIDATION')
        }}
      </p>
      <p v-else-if="success" role="status" class="mb-0 text-sm text-n-teal-11">
        {{
          exportedParts > 1
            ? t('MESSENGER_SIMULATOR.EXPORT_SUCCESS_PARTS', {
                count: exportedParts,
              })
            : t('MESSENGER_SIMULATOR.EXPORT_SUCCESS')
        }}
      </p>
    </div>
    <div
      class="grid min-w-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_355px] xl:grid-cols-[minmax(0,1fr)_410px]"
    >
      <fieldset
        :disabled="disabled || isExporting"
        class="min-w-0 px-5 py-5 lg:px-8"
      >
        <details class="mb-5 border-b border-n-weak pb-4">
          <summary
            class="cursor-pointer rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-n-brand"
          >
            <span class="font-semibold">{{
              initialDefinition
                ? participants.outgoing.name || participantLabels.outgoing
                : participants.incoming.name || participantLabels.incoming
            }}</span>
            <span class="ml-2 text-n-slate-11">{{
              initialDefinition
                ? t('MESSENGER_SIMULATOR.TEMPLATES.EDIT_BUSINESS')
                : t('MESSENGER_SIMULATOR.EDIT_PARTICIPANTS')
            }}</span>
          </summary>
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              v-for="(person, sender) in editableParticipants"
              :id="`simulator-name-${sender}`"
              :key="sender"
              v-model="person.name"
              :label="participantLabels[sender]"
              :maxlength="60"
              required
            />
            <label
              v-if="initialDefinition"
              class="mb-0 flex flex-col gap-1 text-sm"
            >
              {{ t('MESSENGER_SIMULATOR.TEMPLATES.AVATAR') }}
              <select
                v-model="avatarSource"
                class="mb-0 rounded-lg border border-n-weak bg-n-solid-1 text-sm"
              >
                <option value="contact">
                  {{ t('MESSENGER_SIMULATOR.TEMPLATES.CONTACT_AVATAR') }}
                </option>
                <option value="none">
                  {{ t('MESSENGER_SIMULATOR.TEMPLATES.NO_AVATAR') }}
                </option>
              </select>
            </label>
            <div v-else class="space-y-2 sm:col-span-2">
              <label
                for="simulator-avatar-incoming"
                class="mb-0 block text-sm font-medium"
              >
                {{ t('MESSENGER_SIMULATOR.AVATAR') }}
              </label>
              <input
                id="simulator-avatar-incoming"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-describedby="simulator-avatar-hint"
                class="w-full min-w-0 text-xs text-n-slate-11 file:mr-2 file:rounded-lg file:border-0 file:bg-n-alpha-2 file:px-3 file:py-2 file:text-n-slate-12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-n-brand"
                @change="selectAvatar('incoming', $event)"
              />
              <p
                id="simulator-avatar-hint"
                class="mb-0 text-xs text-n-slate-11"
              >
                {{ t('MESSENGER_SIMULATOR.AVATAR_HINT') }}
              </p>
              <Button
                v-if="participants.incoming.avatar"
                variant="ghost"
                color="slate"
                size="sm"
                :disabled="avatarLoading.incoming"
                :label="t('MESSENGER_SIMULATOR.REMOVE_AVATAR')"
                @click="participants.incoming.avatar = ''"
              />
            </div>
          </div>
        </details>
        <section aria-labelledby="simulator-messages-title">
          <div class="mb-3 flex items-baseline justify-between gap-2">
            <h2
              id="simulator-messages-title"
              class="mb-0 text-base font-semibold"
            >
              {{ t('MESSENGER_SIMULATOR.MESSAGES') }}
            </h2>
            <span class="text-xs text-n-slate-11">{{
              t('MESSENGER_SIMULATOR.MESSAGE_COUNT', {
                count: messages.length,
                max: MAX_MESSAGES,
              })
            }}</span>
          </div>
          <p class="mb-3 text-xs text-n-slate-11">
            {{ t('MESSENGER_SIMULATOR.EDIT_HINT') }}
          </p>
          <div v-if="!messages.length" class="py-6 text-center">
            <h3 class="text-sm font-semibold">
              {{ t('MESSENGER_SIMULATOR.EMPTY_TITLE') }}
            </h3>
            <p class="text-sm text-n-slate-11">
              {{ t('MESSENGER_SIMULATOR.EMPTY_DESCRIPTION') }}
            </p>
            <Button
              variant="ghost"
              color="slate"
              size="sm"
              :label="t('MESSENGER_SIMULATOR.LOAD_EXAMPLE')"
              @click="loadExample"
            />
          </div>
          <ol class="m-0 max-h-[38vh] list-none space-y-1 overflow-y-auto p-0">
            <li
              v-for="(message, index) in messages"
              :key="message.id"
              class="flex min-w-0 items-center gap-1 rounded-lg"
              :class="editingId === message.id ? 'bg-n-alpha-2' : ''"
            >
              <button
                type="button"
                class="min-w-0 flex-1 rounded-lg px-3 py-2 text-left hover:bg-n-alpha-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-n-brand"
                :aria-label="
                  t('MESSENGER_SIMULATOR.EDIT_MESSAGE', { number: index + 1 })
                "
                :aria-pressed="editingId === message.id"
                @click="editMessage(message)"
              >
                <span
                  class="mb-1 flex items-center gap-2 text-xs font-medium"
                  :class="
                    message.sender === 'outgoing'
                      ? 'text-n-blue-11'
                      : 'text-n-slate-11'
                  "
                >
                  <span class="truncate">{{
                    participants[message.sender].name ||
                    participantLabels[message.sender]
                  }}</span>
                  <span
                    v-if="message.time"
                    class="shrink-0 font-normal text-n-slate-11"
                  >
                    {{ message.time }}
                  </span>
                </span>
                <span
                  class="line-clamp-2 whitespace-pre-wrap break-words text-sm text-n-slate-12 [overflow-wrap:anywhere]"
                >
                  {{ message.text }}
                </span>
              </button>
              <div class="flex shrink-0 gap-0.5">
                <Button
                  variant="ghost"
                  color="slate"
                  size="sm"
                  icon="i-lucide-arrow-up"
                  :disabled="index === 0"
                  :aria-label="
                    t('MESSENGER_SIMULATOR.MOVE_UP', { number: index + 1 })
                  "
                  @click="moveMessage(index, -1)"
                />
                <Button
                  variant="ghost"
                  color="slate"
                  size="sm"
                  icon="i-lucide-arrow-down"
                  :disabled="index === messages.length - 1"
                  :aria-label="
                    t('MESSENGER_SIMULATOR.MOVE_DOWN', { number: index + 1 })
                  "
                  @click="moveMessage(index, 1)"
                />
                <Button
                  variant="ghost"
                  color="ruby"
                  size="sm"
                  icon="i-lucide-trash-2"
                  :aria-label="
                    t('MESSENGER_SIMULATOR.DELETE_MESSAGE', {
                      number: index + 1,
                    })
                  "
                  @click="deleteMessage(index)"
                />
              </div>
            </li>
          </ol>
          <div
            ref="composerBoxRef"
            class="relative mt-4 rounded-xl border border-n-weak bg-n-solid-1 p-3"
          >
            <MessengerVariablePicker
              v-if="showVariablePicker"
              :caret-position="variableAnchor"
              :entries="variableCatalog"
              @insert="insertVariable"
              @close="showVariablePicker = false"
            />
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div
                class="flex min-w-0 gap-1"
                role="group"
                :aria-label="t('MESSENGER_SIMULATOR.SENDER')"
              >
                <Button
                  v-for="option in senderOptions"
                  :key="option.value"
                  size="sm"
                  :variant="draft.sender === option.value ? 'solid' : 'ghost'"
                  :color="draft.sender === option.value ? 'blue' : 'slate'"
                  :label="option.label"
                  :aria-pressed="draft.sender === option.value"
                  class="max-w-[145px]"
                  @click="draft.sender = option.value"
                />
              </div>
              <span v-if="editingId !== null" class="text-xs text-n-slate-11">{{
                t('MESSENGER_SIMULATOR.EDITING')
              }}</span>
            </div>
            <div
              v-if="initialDefinition"
              class="mb-2 flex flex-wrap items-center gap-2"
            >
              <Button
                variant="ghost"
                color="slate"
                size="sm"
                icon="i-lucide-braces"
                :label="t('MESSENGER_TEMPLATES.VARIABLES.BUTTON')"
                :disabled="
                  editingId === null && messages.length >= MAX_MESSAGES
                "
                :aria-expanded="showVariablePicker"
                @mousedown.prevent
                @click="openVariablePicker"
              />
              <span
                v-if="variableLoadError"
                role="status"
                class="text-xs text-n-ruby-11"
              >
                {{ t('MESSENGER_TEMPLATES.VARIABLES.LOAD_ERROR') }}
              </span>
            </div>
            <p
              v-if="variableLimit"
              role="alert"
              class="mb-2 text-xs text-n-ruby-11"
            >
              {{ t('MESSENGER_SIMULATOR.TEMPLATES.VARIABLE_LIMIT') }}
            </p>
            <label for="simulator-composer" class="sr-only">{{
              t('MESSENGER_SIMULATOR.TEXT')
            }}</label>
            <textarea
              id="simulator-composer"
              ref="composerRef"
              v-model="draft.text"
              rows="3"
              maxlength="500"
              :disabled="editingId === null && messages.length >= MAX_MESSAGES"
              :placeholder="t('MESSENGER_SIMULATOR.TEXT_PLACEHOLDER')"
              class="mb-0 w-full resize-y rounded-lg border-0 bg-transparent px-1 py-2 text-sm text-n-slate-12 placeholder:text-n-slate-11 focus:ring-0"
              @input="variableLimit = false"
              @keydown="onComposerKeydown"
            />
            <div v-if="showTime" class="mb-3 max-w-[200px]">
              <Input
                id="simulator-time"
                v-model="draft.time"
                :maxlength="30"
                :placeholder="t('MESSENGER_SIMULATOR.TIME_PLACEHOLDER')"
                :label="t('MESSENGER_SIMULATOR.TIME')"
              />
            </div>
            <div
              class="flex flex-wrap items-center justify-between gap-2 border-t border-n-weak pt-3"
            >
              <Button
                variant="ghost"
                color="slate"
                size="sm"
                icon="i-lucide-clock"
                :label="t('MESSENGER_SIMULATOR.TIMESTAMP')"
                :aria-expanded="showTime"
                @click="showTime = !showTime"
              />
              <div class="flex gap-2">
                <Button
                  v-if="editingId !== null"
                  variant="ghost"
                  color="slate"
                  size="sm"
                  :label="t('MESSENGER_SIMULATOR.CANCEL_EDIT')"
                  @click="resetComposer"
                />
                <Button
                  size="sm"
                  :icon="
                    editingId !== null ? 'i-lucide-check' : 'i-lucide-plus'
                  "
                  :label="
                    editingId !== null
                      ? t('MESSENGER_SIMULATOR.SAVE_MESSAGE')
                      : t('MESSENGER_SIMULATOR.ADD_MESSAGE')
                  "
                  :disabled="!canSubmit"
                  @click="saveMessage"
                />
              </div>
            </div>
          </div>
          <p class="mt-2 text-xs text-n-slate-11">
            {{ t('MESSENGER_SIMULATOR.KEYBOARD_HINT') }}
          </p>
        </section>
      </fieldset>
      <section
        aria-labelledby="simulator-preview-title"
        class="min-w-0 border-t border-n-weak bg-n-surface-1 px-4 py-5 lg:border-l lg:border-t-0"
      >
        <div class="sticky top-20">
          <h2 id="simulator-preview-title" class="mb-1 text-base font-semibold">
            {{ t('MESSENGER_SIMULATOR.PREVIEW') }}
          </h2>
          <p class="mb-3 text-xs leading-5 text-n-slate-11">
            {{
              initialDefinition
                ? t('MESSENGER_SIMULATOR.TEMPLATES.SAMPLE_HINT')
                : t('MESSENGER_SIMULATOR.PREVIEW_HINT')
            }}
          </p>
          <p
            role="note"
            class="mb-4 rounded-lg bg-n-amber-3 px-3 py-2 text-xs leading-5 text-n-amber-12"
          >
            <strong>{{ t('MESSENGER_SIMULATOR.SIMULATION') }}</strong>
            {{ t('MESSENGER_SIMULATOR.SIMULATION_NOTICE') }}
          </p>
          <div
            class="max-h-[70vh] overflow-auto rounded-xl border border-n-weak"
          >
            <div class="mx-auto w-fit">
              <div class="w-[299px] bg-white">
                <MessengerSimulatorPreview
                  :participants="renderedContent.participants"
                  :messages="renderedContent.messages"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    <MessengerScreenshotRenderer ref="rendererRef" />
  </div>
</template>
