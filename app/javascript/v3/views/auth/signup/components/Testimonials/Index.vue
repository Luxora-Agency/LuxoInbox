<script setup>
import { ref, onBeforeMount } from 'vue';
import TestimonialCard from './TestimonialCard.vue';
import { getTestimonialContent } from '../../../../../api/testimonials';

const emit = defineEmits(['resizeContainers']);

const testimonial = ref(null);

const fetchTestimonials = async () => {
  try {
    const { data } = await getTestimonialContent();
    if (data.length) {
      testimonial.value = data[Math.floor(Math.random() * data.length)];
    }
  } catch {
    // Ignoring the error as the UI wouldn't break
  } finally {
    emit('resizeContainers', !!testimonial.value);
  }
};

onBeforeMount(() => {
  fetchTestimonials();
});
</script>

<template>
  <div
    class="relative flex-1 flex flex-col items-start justify-center bg-gradient-to-br from-n-alpha-black2 to-n-brand/5 dark:from-n-solid-3 dark:to-n-brand/5 px-12 py-14 rounded-e-2xl"
  >
    <TestimonialCard
      v-if="testimonial"
      :review-content="testimonial.authorReview"
      :author-image="testimonial.authorImage"
      :author-name="testimonial.authorName"
      :author-designation="testimonial.authorCompany"
    />
    <div class="absolute bottom-8 right-8 grid grid-cols-3 gap-2">
      <span class="w-2 h-2 rounded-full bg-n-slate-6/50 dark:bg-n-slate-6/30" />
      <span class="w-2 h-2 rounded-full bg-n-slate-6/50 dark:bg-n-slate-6/30" />
      <span class="w-2 h-2 rounded-full bg-n-slate-6/50 dark:bg-n-slate-6/30" />
      <span class="w-2 h-2 rounded-full bg-n-slate-6/50 dark:bg-n-slate-6/30" />
      <span class="w-2 h-2 rounded-full bg-n-slate-6/50 dark:bg-n-slate-6/30" />
      <span class="w-2 h-2 rounded-full bg-n-slate-6/50 dark:bg-n-slate-6/30" />
    </div>
  </div>
</template>
