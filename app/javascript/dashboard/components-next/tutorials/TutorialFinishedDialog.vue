<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useTutorials } from 'dashboard/composables/useTutorials';

import Dialog from 'dashboard/components-next/dialog/Dialog.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';

const { t } = useI18n();

const { finishedTour, nextTour, clearFinishedTour, startTour } = useTutorials();

const dialogRef = ref(null);

const isVisible = computed(() => Boolean(finishedTour.value));

const nextTourName = computed(() => {
  const tour = nextTour.value;
  if (!tour) return '';

  return t(`TUTORIALS.TOURS.${tour.id.toUpperCase().replace(/-/g, '_')}.NAME`);
});

watch(isVisible, value => {
  if (value) dialogRef.value?.open();
  else dialogRef.value?.close();
});

const onClose = () => {
  clearFinishedTour();
};

// The engine picks the tour up from `activeTour`, so the modal has to leave
// the top layer before driver.js starts highlighting anything.
const onNext = async () => {
  const tour = nextTour.value;
  clearFinishedTour();
  await nextTick();
  if (tour) startTour(tour.id);
};
</script>

<template>
  <Dialog
    ref="dialogRef"
    width="md"
    :aria-label="t('TUTORIALS.FINISHED.TITLE')"
    :show-cancel-button="false"
    :show-confirm-button="false"
    @close="onClose"
  >
    <div class="flex flex-col items-center gap-5 pt-2 text-center">
      <span
        class="grid rounded-2xl size-14 place-items-center bg-orbis-navy ring-1 ring-orbis-neon/25 dark:ring-orbis-neon/40"
      >
        <Icon icon="i-lucide-party-popper" class="size-7 text-orbis-neon" />
      </span>

      <div class="flex flex-col gap-2">
        <h2 class="mb-0 text-xl font-semibold tracking-tight text-n-slate-12">
          {{ t('TUTORIALS.FINISHED.TITLE') }}
        </h2>
        <p class="max-w-sm mb-0 text-sm leading-relaxed text-n-slate-11">
          {{ t('TUTORIALS.FINISHED.BODY') }}
        </p>
      </div>

      <div class="flex flex-col w-full gap-2 pt-1">
        <button
          v-if="nextTour"
          type="button"
          class="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ease-out motion-reduce:transition-none rounded-lg bg-orbis-neon text-orbis-navy hover:bg-orbis-neon/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon focus-visible:ring-offset-2 focus-visible:ring-offset-n-background"
          @click="onNext"
        >
          {{ t('TUTORIALS.FINISHED.NEXT_TOUR', { section: nextTourName }) }}
          <Icon icon="i-lucide-arrow-right" class="size-4" />
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out motion-reduce:transition-none rounded-lg text-n-slate-11 hover:bg-n-alpha-2 hover:text-n-slate-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon"
          @click="onClose"
        >
          {{ t('TUTORIALS.FINISHED.CLOSE') }}
        </button>
      </div>
    </div>
  </Dialog>
</template>
