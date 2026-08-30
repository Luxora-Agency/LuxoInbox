<script setup>
import { computed } from 'vue';

const props = defineProps({
  headers: {
    type: Array,
    default: () => [],
  },
  items: {
    type: Array,
    default: () => [],
  },
  noDataMessage: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  // Drops the card chrome so the table can sit inside a card of its own.
  flat: {
    type: Boolean,
    default: false,
  },
});

const hasHeaderSlot = computed(() => !!props.headers.length);
const showHeaders = computed(
  () => hasHeaderSlot.value && props.items.length > 0
);
</script>

<template>
  <div
    class="w-full overflow-x-auto"
    :class="flat ? '' : 'rounded-xl border border-n-weak bg-n-solid-1'"
  >
    <table class="min-w-full table-auto">
      <thead v-if="showHeaders" class="bg-n-alpha-1">
        <tr class="border-b border-n-weak">
          <th
            v-for="(header, index) in headers"
            :key="index"
            class="px-4 py-3 text-start font-mono text-[11px] font-medium uppercase tracking-wide text-n-slate-11 whitespace-nowrap"
          >
            <slot :name="`header-${index}`" :header="header">
              {{ header }}
            </slot>
          </th>
        </tr>
      </thead>
      <tbody class="text-n-slate-11">
        <template v-if="items.length">
          <slot name="row" :items="items" />
        </template>
        <tr v-else-if="noDataMessage && !loading">
          <td
            :colspan="headers.length || 1"
            class="py-20 text-center text-body-main !text-base text-n-slate-11"
          >
            {{ noDataMessage }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
