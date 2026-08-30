<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <tr
    class="border-b border-n-weak/60 last:border-b-0 transition-colors duration-150 ease-out hover:bg-n-alpha-1 motion-reduce:transition-none"
  >
    <slot :item="item" />
  </tr>
</template>
