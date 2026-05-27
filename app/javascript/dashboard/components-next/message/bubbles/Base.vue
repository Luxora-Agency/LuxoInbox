<script setup>
import { computed } from 'vue';

import MessageMeta from '../MessageMeta.vue';

import { emitter } from 'shared/helpers/mitt';
import { useMessageContext } from '../provider.js';
import { useI18n } from 'vue-i18n';

import MessageFormatter from 'shared/helpers/MessageFormatter.js';
import { BUS_EVENTS } from 'shared/constants/busEvents';
import { MESSAGE_VARIANTS, ORIENTATION } from '../constants';

const props = defineProps({
  hideMeta: { type: Boolean, default: false },
});

const { variant, orientation, inReplyTo, shouldGroupWithNext } =
  useMessageContext();
const { t } = useI18n();

const varaintBaseMap = {
  [MESSAGE_VARIANTS.AGENT]:
    'bg-gradient-to-br from-woot-500 to-woot-600 text-white shadow-lg shadow-woot-500/25',
  [MESSAGE_VARIANTS.PRIVATE]:
    'bg-amber-100/90 dark:bg-amber-500/20 backdrop-blur-sm text-amber-900 dark:text-amber-200 border border-amber-200/50 dark:border-amber-500/30 [&_.prosemirror-mention-node]:font-semibold',
  [MESSAGE_VARIANTS.USER]:
    'bg-white/90 dark:bg-n-solid-3/90 backdrop-blur-sm text-n-slate-12 border border-n-slate-2 dark:border-n-solid-2 shadow-sm',
  [MESSAGE_VARIANTS.ACTIVITY]:
    'bg-n-slate-2/50 dark:bg-n-solid-3/50 text-n-slate-11 text-sm',
  [MESSAGE_VARIANTS.BOT]:
    'bg-gradient-to-br from-woot-400 to-woot-600 text-white shadow-lg shadow-woot-500/25',
  [MESSAGE_VARIANTS.TEMPLATE]:
    'bg-gradient-to-br from-woot-400 to-woot-600 text-white shadow-lg shadow-woot-500/25',
  [MESSAGE_VARIANTS.ERROR]:
    'bg-red-100/90 dark:bg-red-500/20 backdrop-blur-sm text-red-900 dark:text-red-200 border border-red-200/50 dark:border-red-500/30',
  [MESSAGE_VARIANTS.EMAIL]: 'w-full',
  [MESSAGE_VARIANTS.UNSUPPORTED]:
    'bg-amber-100/70 dark:bg-amber-500/20 border border-dashed border-amber-400 dark:border-amber-500/50 text-amber-800 dark:text-amber-200',
};

const orientationMap = {
  [ORIENTATION.LEFT]:
    'left-bubble rounded-xl ltr:rounded-bl-sm rtl:rounded-br-sm',
  [ORIENTATION.RIGHT]:
    'right-bubble rounded-xl ltr:rounded-br-sm rtl:rounded-bl-sm',
  [ORIENTATION.CENTER]: 'rounded-md',
};

const flexOrientationClass = computed(() => {
  const map = {
    [ORIENTATION.LEFT]: 'justify-start',
    [ORIENTATION.RIGHT]: 'justify-end',
    [ORIENTATION.CENTER]: 'justify-center',
  };

  return map[orientation.value];
});

const messageClass = computed(() => {
  const classToApply = [varaintBaseMap[variant.value]];

  if (variant.value !== MESSAGE_VARIANTS.ACTIVITY) {
    classToApply.push(orientationMap[orientation.value]);
  } else {
    classToApply.push('rounded-lg');
  }

  return classToApply;
});

const scrollToMessage = () => {
  emitter.emit(BUS_EVENTS.SCROLL_TO_MESSAGE, {
    messageId: inReplyTo.value.id,
  });
};

const shouldShowMeta = computed(
  () =>
    !props.hideMeta &&
    !shouldGroupWithNext.value &&
    variant.value !== MESSAGE_VARIANTS.ACTIVITY
);

const replyToPreview = computed(() => {
  if (!inReplyTo) return '';

  const { content, attachments } = inReplyTo.value;

  if (content) return new MessageFormatter(content).formattedMessage;
  if (attachments?.length) {
    const firstAttachment = attachments[0];
    const fileType = firstAttachment.fileType ?? firstAttachment.file_type;

    return t(`CHAT_LIST.ATTACHMENTS.${fileType}.CONTENT`);
  }

  return t('CONVERSATION.REPLY_MESSAGE_NOT_FOUND');
});
</script>

<template>
  <div
    class="luxo-message-bubble text-sm"
    :data-message-variant="variant"
    :class="[
      messageClass,
      {
        'max-w-lg': variant !== MESSAGE_VARIANTS.EMAIL,
      },
    ]"
  >
    <div
      v-if="inReplyTo"
      class="p-2 -mx-1 mb-2 rounded-lg cursor-pointer bg-n-alpha-black1"
      @click="scrollToMessage"
    >
      <div
        v-dompurify-html="replyToPreview"
        class="prose prose-bubble line-clamp-2"
      />
    </div>
    <slot />
    <MessageMeta
      v-if="shouldShowMeta"
      :class="[
        flexOrientationClass,
        variant === MESSAGE_VARIANTS.EMAIL ? 'px-3 pb-3' : '',
        variant === MESSAGE_VARIANTS.PRIVATE
          ? 'text-n-amber-12/50'
          : 'text-n-slate-11',
      ]"
      class="mt-2"
    />
  </div>
</template>
