<script setup>
import { computed, nextTick, ref } from 'vue';
import { vOnClickOutside } from '@vueuse/components';
import { useDropdownPosition } from 'dashboard/composables/useDropdownPosition';
import SLAPopoverCard from 'dashboard/components/widgets/conversation/components/SLAPopoverCard.vue';
import TeleportWithDirection from 'dashboard/components-next/TeleportWithDirection.vue';
import NextButton from 'dashboard/components-next/button/Button.vue';

defineProps({
  slaEvents: {
    type: Array,
    default: () => [],
  },
});

const triggerRef = ref(null);
const popoverRef = ref(null);
const showSlaPopoverCard = ref(false);

// The table scrolls sideways, so any ancestor-positioned card gets clipped.
// Teleport it to the body and pin it to the viewport next to the trigger.
const { fixedPosition, updatePosition } = useDropdownPosition(
  triggerRef,
  popoverRef,
  showSlaPopoverCard
);

const popoverStyle = computed(() => {
  const { maxHeight, ...rest } = fixedPosition.value.style;
  return {
    ...rest,
    // Keep the card's own 24rem cap while staying inside the viewport.
    maxHeight: maxHeight ? `min(24rem, ${maxHeight})` : '24rem',
    zIndex: 9999,
  };
});

const closeSlaEvents = () => {
  showSlaPopoverCard.value = false;
};

const openSlaEvents = async () => {
  showSlaPopoverCard.value = !showSlaPopoverCard.value;
  if (!showSlaPopoverCard.value) return;
  await nextTick();
  updatePosition();
};
</script>

<template>
  <div class="flex items-center col-span-2 text-n-slate-11 justify-end">
    <div ref="triggerRef">
      <NextButton
        link
        slate
        type="button"
        :label="$t('SLA_REPORTS.TABLE.VIEW_DETAILS')"
        @click="openSlaEvents"
      />
    </div>
    <TeleportWithDirection to="body">
      <SLAPopoverCard
        v-if="showSlaPopoverCard"
        ref="popoverRef"
        v-on-click-outside="[closeSlaEvents, { ignore: [triggerRef] }]"
        position="fixed"
        :sla-missed-events="slaEvents"
        :style="popoverStyle"
      />
    </TeleportWithDirection>
  </div>
</template>
