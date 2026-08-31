<script setup>
import { computed } from 'vue';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@vue-flow/core';

const props = defineProps({
  id: { type: String, required: true },
  sourceX: { type: Number, required: true },
  sourceY: { type: Number, required: true },
  targetX: { type: Number, required: true },
  targetY: { type: Number, required: true },
  sourcePosition: { type: String, required: true },
  targetPosition: { type: String, required: true },
  markerEnd: { type: String, default: '' },
  data: { type: Object, default: () => ({}) },
});

const smoothStepPath = computed(() =>
  getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    borderRadius: 12,
  })
);

// Vue Flow places HTML edge labels with a transform. Only this geometry is inline —
// every visual choice below stays in Tailwind classes.
const labelTransform = computed(() => {
  const [, labelX, labelY] = smoothStepPath.value;
  return `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`;
});
</script>

<template>
  <BaseEdge
    :id="id"
    :path="smoothStepPath[0]"
    :marker-end="markerEnd"
    class="!stroke-[1.5]"
    :class="[
      data.isFinal ? '!stroke-n-blue-9' : '!stroke-n-slate-8',
      data.dimmed ? 'opacity-40' : '',
    ]"
  />
  <EdgeLabelRenderer>
    <div
      :style="{ transform: labelTransform }"
      class="absolute px-1.5 py-0.5 font-mono text-[10px] leading-[1.4] rounded-md pointer-events-none bg-n-solid-1 border border-n-weak"
      :class="[
        data.isFinal ? 'text-n-blue-11' : 'text-n-slate-11',
        data.dimmed ? 'opacity-40' : '',
      ]"
    >
      {{ data.label }}
    </div>
  </EdgeLabelRenderer>
</template>
