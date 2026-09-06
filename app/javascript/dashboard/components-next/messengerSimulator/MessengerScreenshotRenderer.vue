<script setup>
import { nextTick, ref } from 'vue';
import MessengerSimulatorPreview from './MessengerSimulatorPreview.vue';
import { exportScreenshot } from './exportScreenshot';

const captureRef = ref(null);
const participants = ref(null);
const page = ref([]);

const download = async options => {
  participants.value = options.participants;
  try {
    return await exportScreenshot({
      ...options,
      render: async messages => {
        page.value = messages;
        await nextTick();
        return captureRef.value;
      },
    });
  } finally {
    participants.value = null;
    page.value = [];
  }
};

defineExpose({ download });
</script>

<template>
  <Teleport to="body">
    <div
      v-if="participants"
      aria-hidden="true"
      class="pointer-events-none fixed -left-[10000px] top-0"
    >
      <div ref="captureRef" class="w-[299px] bg-white">
        <MessengerSimulatorPreview
          :participants="participants"
          :messages="page"
        />
      </div>
    </div>
  </Teleport>
</template>
