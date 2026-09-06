<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  participants: { type: Object, required: true },
  messages: { type: Array, required: true },
});
const { t } = useI18n();
</script>

<template>
  <div
    dir="ltr"
    class="w-[299px] shrink-0 overflow-hidden border-l-[4px] border-r border-[#f1f2f6] bg-white text-[12px] leading-[16.4px] text-[#050505] [font-family:Arial,Helvetica,sans-serif]"
  >
    <header
      class="flex h-[28px] items-start overflow-hidden border-b border-[#f1f2f6] pl-[8px]"
    >
      <span
        aria-hidden="true"
        class="i-ri-arrow-left-s-line mr-[10px] mt-[1px] size-[12px] shrink-0 text-[#65676b]"
      />
      <div
        class="relative -top-[8px] mr-[8px] flex size-[30px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e5e6eb] text-[#8a8d91]"
      >
        <img
          v-if="participants.incoming.avatar"
          :src="participants.incoming.avatar"
          alt=""
          class="size-full object-cover"
        />
        <span v-else aria-hidden="true" class="i-ri-user-3-fill size-[21px]" />
      </div>
      <div class="min-w-0 flex-1 truncate text-[14px] font-bold leading-[18px]">
        {{ participants.incoming.name }}
      </div>
      <div
        aria-hidden="true"
        class="-mr-[7px] ml-[8px] mt-[1px] flex shrink-0 gap-[13px] text-[#65676b]"
      >
        <span class="i-ri-pencil-line size-[14px]" />
        <span class="i-ri-money-dollar-circle-line size-[14px]" />
        <span class="i-ri-more-2-fill size-[14px]" />
      </div>
    </header>
    <div class="space-y-[8px] pl-[7px] pr-[5px]">
      <p
        v-if="!messages.length"
        class="m-0 px-5 py-12 text-center text-[12px] text-[#8a8d91]"
      >
        {{ t('MESSENGER_SIMULATOR.EMPTY_DESCRIPTION') }}
      </p>
      <div v-for="message in messages" :key="message.id">
        <div
          v-if="message.time.trim()"
          class="flex h-[26px] items-center justify-center pb-[4px] text-center text-[9px] leading-[12px] text-[#8a8d91]"
        >
          {{ message.time }}
        </div>
        <div
          class="flex items-end gap-[6px]"
          :class="message.sender === 'outgoing' ? 'justify-end' : ''"
        >
          <div
            v-if="message.sender === 'incoming'"
            class="flex size-[30px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e5e6eb] text-[#8a8d91]"
          >
            <img
              v-if="participants.incoming.avatar"
              :src="participants.incoming.avatar"
              alt=""
              class="size-full object-cover"
            />
            <span
              v-else
              aria-hidden="true"
              class="i-ri-user-3-fill size-[21px]"
            />
          </div>
          <div
            class="max-w-[203px] whitespace-pre-wrap break-words rounded-[16px] px-[12px] [overflow-wrap:anywhere]"
            :class="
              message.sender === 'outgoing'
                ? 'rounded-br-[3px] bg-[#0084ff] py-[7px] text-white'
                : 'rounded-bl-[2px] bg-[#e5e6eb] py-[8px] leading-[17px]'
            "
          >
            {{ message.text }}
          </div>
        </div>
      </div>
    </div>
    <footer
      aria-hidden="true"
      class="flex h-[35px] items-start gap-[9.5px] overflow-hidden border-t border-[#f1f2f6] pl-[10px] pt-[5px] text-[#0084ff]"
    >
      <span
        class="mt-[7px] flex size-[14px] shrink-0 items-center justify-center"
      >
        <span class="i-ri-layout-grid-fill size-[12px]" />
      </span>
      <span
        class="mt-[7px] flex size-[14px] shrink-0 items-center justify-center"
      >
        <span class="i-ri-camera-3-line size-[12px]" />
      </span>
      <span
        class="mt-[7px] flex size-[14px] shrink-0 items-center justify-center"
      >
        <span class="i-ri-image-2-line size-[12px]" />
      </span>
      <span
        class="mt-[7px] flex size-[14px] shrink-0 items-center justify-center"
      >
        <span class="i-ri-mic-line size-[12px]" />
      </span>
      <div
        class="flex h-[31px] w-[151px] shrink-0 items-center gap-[7px] rounded-full bg-[#f1f2f6] pl-[9px] pr-[6px] text-[#8a8d91]"
      >
        <span class="flex-1 text-[12px]">{{
          t('MESSENGER_SIMULATOR.MOCK_COMPOSER')
        }}</span>
      </div>
      <span class="i-ri-emotion-happy-line mt-[7px] size-[14px] shrink-0" />
      <span class="i-ri-thumb-up-fill mt-[7px] size-[14px] shrink-0" />
    </footer>
  </div>
</template>
