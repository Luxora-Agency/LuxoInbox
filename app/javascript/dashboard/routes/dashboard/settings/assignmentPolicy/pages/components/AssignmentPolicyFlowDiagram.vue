<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core';
import { VueFlow, Handle, Position, MarkerType } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import { useMapGetter } from 'dashboard/composables/store';
import AssignmentPolicyFlowEdge from './AssignmentPolicyFlowEdge.vue';
import {
  ROUND_ROBIN,
  BALANCED,
  EARLIEST_CREATED,
  DEFAULT_FAIR_DISTRIBUTION_LIMIT,
  DEFAULT_FAIR_DISTRIBUTION_WINDOW,
} from 'dashboard/routes/dashboard/settings/assignmentPolicy/constants';

const props = defineProps({
  enabled: {
    type: Boolean,
    default: true,
  },
  assignmentOrder: {
    type: String,
    default: ROUND_ROBIN,
  },
  conversationPriority: {
    type: String,
    default: EARLIEST_CREATED,
  },
  fairDistributionLimit: {
    type: Number,
    default: DEFAULT_FAIR_DISTRIBUTION_LIMIT,
  },
  fairDistributionWindow: {
    type: Number,
    default: DEFAULT_FAIR_DISTRIBUTION_WINDOW,
  },
  excludeOlderThanHours: {
    type: Number,
    default: null,
  },
});

const { t } = useI18n();
const route = useRoute();
const isFeatureEnabledonAccount = useMapGetter(
  'accounts/isFeatureEnabledonAccount'
);

const FLOW_KEY = 'ASSIGNMENT_POLICY.FLOW';

const MINUTES_PER_DAY = 24 * 60;
// Serpentine grid for the wide layout; fitView scales it into the card
const COLUMNS = 3;
const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 170;
// The narrow layout stacks compact cards, so it needs far less room per step
const MOBILE_ROW_HEIGHT = 78;
const FIT_VIEW_PADDING = 0.22;
const PULSE_DURATION = 1200;

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller('md');

const hasAdvancedAssignment = computed(() =>
  isFeatureEnabledonAccount.value(
    Number(route.params.accountId),
    'advanced_assignment'
  )
);

// Capacity is only consulted by the balanced selector, and only when the account owns the
// advanced feature — otherwise the pipeline really does skip that step
const hasCapacityCheck = computed(
  () => props.assignmentOrder === BALANCED && hasAdvancedAssignment.value
);

const ageLimitHours = computed(() => Number(props.excludeOlderThanHours) || 0);

const formatMinutes = minutes => {
  if (!minutes) return t(`${FLOW_KEY}.DURATION.MINUTES`, { count: 0 });
  if (minutes % MINUTES_PER_DAY === 0) {
    return t(`${FLOW_KEY}.DURATION.DAYS`, { count: minutes / MINUTES_PER_DAY });
  }
  if (minutes % 60 === 0) {
    return t(`${FLOW_KEY}.DURATION.HOURS`, { count: minutes / 60 });
  }
  return t(`${FLOW_KEY}.DURATION.MINUTES`, { count: minutes });
};

const excludeOlderValue = computed(() =>
  ageLimitHours.value
    ? t(`${FLOW_KEY}.EXCLUDE_OLDER.VALUE`, {
        duration: formatMinutes(ageLimitHours.value * 60),
      })
    : t(`${FLOW_KEY}.EXCLUDE_OLDER.VALUE_EMPTY`)
);

const priorityValue = computed(() =>
  t(
    `${FLOW_KEY}.PRIORITY.${(props.conversationPriority || EARLIEST_CREATED).toUpperCase()}`
  )
);

const orderValue = computed(() =>
  t(
    `${FLOW_KEY}.ASSIGN.${(props.assignmentOrder || ROUND_ROBIN).toUpperCase()}`
  )
);

const fairDistributionValue = computed(() =>
  t(`${FLOW_KEY}.FAIR_DISTRIBUTION.VALUE`, {
    limit: Number(props.fairDistributionLimit) || 0,
    window: formatMinutes(
      Math.floor((Number(props.fairDistributionWindow) || 0) / 60)
    ),
  })
);

// Every step the runtime actually walks, in order, with the value it is working from
const steps = computed(() => {
  const pipeline = [
    {
      id: 'incoming',
      category: 'ENTRY',
      icon: 'i-lucide-inbox',
      title: t(`${FLOW_KEY}.INCOMING.TITLE`),
      value: t(`${FLOW_KEY}.INCOMING.VALUE`),
    },
    {
      id: 'excludeOlder',
      category: 'FILTER',
      icon: 'i-lucide-clock-alert',
      title: t(`${FLOW_KEY}.EXCLUDE_OLDER.TITLE`),
      value: excludeOlderValue.value,
      inactive: !ageLimitHours.value,
    },
    {
      id: 'priority',
      category: 'ORDER',
      icon: 'i-lucide-arrow-down-narrow-wide',
      title: t(`${FLOW_KEY}.PRIORITY.TITLE`),
      value: priorityValue.value,
    },
    {
      id: 'teamFilter',
      category: 'TEAM',
      icon: 'i-lucide-users',
      title: t(`${FLOW_KEY}.TEAM_FILTER.TITLE`),
      value: t(`${FLOW_KEY}.TEAM_FILTER.VALUE`),
    },
    {
      id: 'fairDistribution',
      category: 'LIMIT',
      icon: 'i-lucide-gauge',
      title: t(`${FLOW_KEY}.FAIR_DISTRIBUTION.TITLE`),
      value: fairDistributionValue.value,
    },
  ];

  if (hasCapacityCheck.value) {
    pipeline.push({
      id: 'capacity',
      category: 'CAPACITY',
      icon: 'i-lucide-battery-medium',
      title: t(`${FLOW_KEY}.CAPACITY.TITLE`),
      value: t(`${FLOW_KEY}.CAPACITY.VALUE`),
    });
  }

  pipeline.push({
    id: 'assign',
    category: 'ASSIGNMENT',
    icon: 'i-lucide-user-check',
    title: t(`${FLOW_KEY}.ASSIGN.TITLE`),
    value: orderValue.value,
    isResult: true,
  });

  return pipeline;
});

const EDGE_LABEL_KEYS = {
  incoming: 'UNASSIGNED',
  excludeOlder: 'STILL_VALID',
  priority: 'IN_ORDER',
  teamFilter: 'TEAM_ONLY',
  fairDistribution: 'WITHIN_LIMIT',
  capacity: 'WITH_CAPACITY',
};

const gridSlot = index => {
  const row = Math.floor(index / COLUMNS);
  const slot = index % COLUMNS;
  // Odd rows run right to left so the pipeline reads as one continuous ribbon
  return { row, column: row % 2 === 0 ? slot : COLUMNS - 1 - slot };
};

const handlePair = (from, to) => {
  if (to.row > from.row) return [Position.Bottom, Position.Top];
  if (to.column > from.column) return [Position.Right, Position.Left];
  return [Position.Left, Position.Right];
};

// Fixed positions per variant: the graph is small and the reading order matters more than
// anything an auto-layout would pick
const positionedSteps = computed(() => {
  const pipeline = steps.value;

  if (isMobile.value) {
    return pipeline.map((step, index) => ({
      ...step,
      position: { x: 0, y: index * MOBILE_ROW_HEIGHT },
      target: index === 0 ? null : Position.Top,
      source: index === pipeline.length - 1 ? null : Position.Bottom,
    }));
  }

  const slots = pipeline.map((_, index) => gridSlot(index));

  return pipeline.map((step, index) => {
    const slot = slots[index];
    const previous = index > 0 ? handlePair(slots[index - 1], slot) : null;
    const next =
      index < pipeline.length - 1 ? handlePair(slot, slots[index + 1]) : null;

    return {
      ...step,
      position: { x: slot.column * COLUMN_WIDTH, y: slot.row * ROW_HEIGHT },
      target: previous ? previous[1] : null,
      source: next ? next[0] : null,
    };
  });
});

const pulsingNodeId = ref(null);
let pulseTimer = null;

// Cause and effect: touching a field lights up the step it controls
const pulseNode = id => {
  pulsingNodeId.value = id;
  clearTimeout(pulseTimer);
  pulseTimer = setTimeout(() => {
    pulsingNodeId.value = null;
  }, PULSE_DURATION);
};

watch(
  () => props.excludeOlderThanHours,
  () => pulseNode('excludeOlder')
);
watch(
  () => props.conversationPriority,
  () => pulseNode('priority')
);
watch(
  () => props.assignmentOrder,
  () => pulseNode('assign')
);
watch(
  () => [props.fairDistributionLimit, props.fairDistributionWindow],
  () => pulseNode('fairDistribution')
);

onBeforeUnmount(() => clearTimeout(pulseTimer));

const nodes = computed(() =>
  positionedSteps.value.map(step => ({
    id: step.id,
    type: 'policy',
    position: step.position,
    data: {
      ...step,
      compact: isMobile.value,
      paused: !props.enabled,
      pulsing: pulsingNodeId.value === step.id,
    },
  }))
);

const edges = computed(() => {
  const pipeline = positionedSteps.value;

  return pipeline.slice(0, -1).map((step, index) => {
    const next = pipeline[index + 1];

    return {
      id: `${step.id}-${next.id}`,
      source: step.id,
      target: next.id,
      type: 'narrated',
      markerEnd: MarkerType.ArrowClosed,
      data: {
        // Chips only fit on vertical segments: the serpentine's column gap is
        // narrower than a label, so horizontal edges rely on their arrowheads.
        label:
          step.position.x === next.position.x
            ? t(`${FLOW_KEY}.EDGE.${EDGE_LABEL_KEYS[step.id]}`)
            : undefined,
        isFinal: Boolean(next.isResult),
        dimmed: !props.enabled,
      },
    };
  });
});

// Screen readers get the same pipeline as prose, since the canvas exposes no structure
const narratedSteps = computed(() =>
  positionedSteps.value.map(step => ({
    id: step.id,
    text: step.inactive
      ? t(`${FLOW_KEY}.NARRATION.STEP_INACTIVE`, {
          title: step.title,
          value: step.value,
          note: t(`${FLOW_KEY}.INACTIVE_NOTE`),
        })
      : t(`${FLOW_KEY}.NARRATION.STEP`, {
          title: step.title,
          value: step.value,
        }),
  }))
);

const canvasHeightClass = computed(() => {
  if (isMobile.value) {
    return positionedSteps.value.length > 6 ? 'h-[550px]' : 'h-[470px]';
  }
  return positionedSteps.value.length > 6 ? 'h-[440px]' : 'h-[320px]';
});

// Vue Flow has no fit-view-on-init options prop; the padding belongs to the fitView call
const flowInstance = ref(null);

const fitDiagram = () =>
  flowInstance.value?.fitView({ padding: FIT_VIEW_PADDING });

const handlePaneReady = instance => {
  flowInstance.value = instance;
  instance.fitView({ padding: FIT_VIEW_PADDING });
};

// Swapping between the wide and narrow variants moves every node, so re-fit once the new
// positions have rendered
watch([isMobile, () => positionedSteps.value.length], async () => {
  await nextTick();
  fitDiagram();
});
</script>

<template>
  <section
    class="flex flex-col gap-3 p-4 rounded-2xl bg-n-alpha-1 outline outline-1 outline-n-weak"
  >
    <div class="flex flex-col gap-1">
      <h3 class="text-sm font-medium text-n-slate-12">
        {{ t(`${FLOW_KEY}.TITLE`) }}
      </h3>
      <p class="mb-0 text-sm text-n-slate-11">
        {{ t(`${FLOW_KEY}.DESCRIPTION`) }}
      </p>
    </div>

    <!-- The canvas carries no semantics screen readers can walk, so it is hidden and the
         ordered list below narrates the same pipeline with the same live values -->
    <div
      aria-hidden="true"
      class="relative w-full rounded-xl overflow-hidden bg-[radial-gradient(circle,rgb(var(--slate-6)/0.45)_1px,transparent_1px)] bg-[length:18px_18px]"
      :class="canvasHeightClass"
    >
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :nodes-draggable="false"
        :nodes-connectable="false"
        :nodes-focusable="false"
        :edges-focusable="false"
        :edges-updatable="false"
        :elements-selectable="false"
        :pan-on-drag="false"
        :pan-on-scroll="false"
        :zoom-on-scroll="false"
        :zoom-on-pinch="false"
        :zoom-on-double-click="false"
        :prevent-scrolling="false"
        :min-zoom="0.2"
        :max-zoom="1"
        default-marker-color="rgb(var(--blue-9) / 0.7)"
        @pane-ready="handlePaneReady"
      >
        <template #edge-narrated="edgeProps">
          <AssignmentPolicyFlowEdge v-bind="edgeProps" />
        </template>

        <template #node-policy="{ data }">
          <div
            class="text-left rounded-xl bg-n-solid-1 outline outline-1 transition-shadow duration-300 motion-reduce:transition-none"
            :class="[
              data.compact
                ? 'flex items-start gap-2 w-[210px] px-3 py-2'
                : 'flex flex-col gap-1 w-[200px] px-3 py-2.5',
              data.isResult
                ? 'outline-n-blue-9/40 shadow-[0_0_16px_rgb(var(--blue-9)/0.14)]'
                : 'outline-n-weak',
              data.pulsing
                ? 'ring-2 ring-n-blue-9/70'
                : 'ring-0 ring-transparent',
              data.paused || data.inactive ? 'opacity-50' : '',
            ]"
          >
            <!-- style.css positions handles but paints nothing, so they stay invisible
                 without pulling in theme-default.css -->
            <Handle v-if="data.target" type="target" :position="data.target" />

            <span
              class="shrink-0 size-4 text-n-blue-11"
              :class="[data.icon, data.compact ? 'mt-0.5' : '']"
            />

            <div class="flex flex-col gap-0.5 min-w-0">
              <span
                v-if="!data.compact"
                class="font-mono text-[10px] uppercase tracking-wider leading-none text-n-slate-10"
              >
                {{ t(`${FLOW_KEY}.CATEGORY.${data.category}`) }}
              </span>
              <span class="text-sm font-medium leading-tight text-n-slate-12">
                {{ data.title }}
              </span>
              <span
                class="text-xs leading-tight"
                :class="data.isResult ? 'text-n-blue-11' : 'text-n-slate-11'"
              >
                {{ data.value }}
              </span>
              <span
                v-if="data.inactive && !data.compact"
                class="text-[11px] leading-tight italic text-n-slate-10"
              >
                {{ t(`${FLOW_KEY}.INACTIVE_NOTE`) }}
              </span>
            </div>

            <Handle v-if="data.source" type="source" :position="data.source" />
          </div>
        </template>

        <div
          class="absolute z-10 flex flex-col gap-1 pointer-events-none bottom-3 ltr:left-3 rtl:right-3"
        >
          <span class="font-mono text-[11px] leading-none text-n-slate-10">
            {{ t(`${FLOW_KEY}.CAPTION`) }}
          </span>
          <span
            class="flex items-center gap-1.5 font-mono text-[10px] leading-none text-n-slate-10"
          >
            <span class="size-1.5 rounded-full bg-n-blue-9" />
            {{ t(`${FLOW_KEY}.LEGEND`) }}
          </span>
        </div>

        <div
          v-if="!enabled"
          class="absolute z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg pointer-events-none top-3 ltr:right-3 rtl:left-3 bg-n-solid-1 outline outline-1 outline-n-weak"
        >
          <span class="size-4 shrink-0 i-lucide-pause text-n-slate-11" />
          <span class="text-xs font-medium text-n-slate-12">
            {{ t(`${FLOW_KEY}.PAUSED`) }}
          </span>
        </div>
      </VueFlow>
    </div>

    <ol class="sr-only">
      <li v-if="!enabled">{{ t(`${FLOW_KEY}.PAUSED`) }}</li>
      <li v-for="step in narratedSteps" :key="step.id">{{ step.text }}</li>
    </ol>
  </section>
</template>
