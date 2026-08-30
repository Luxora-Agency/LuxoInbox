<script setup>
import { isVNode, computed } from 'vue';
import Icon from 'next/icon/Icon.vue';
import Policy from 'dashboard/components/policy.vue';
import { useSidebarContext } from './provider';
import SidebarUnreadBadge from './SidebarUnreadBadge.vue';

const props = defineProps({
  label: { type: String, required: true },
  to: { type: [String, Object], required: true },
  icon: { type: [String, Object], default: null },
  active: { type: Boolean, default: false },
  component: { type: Function, default: null },
  badgeCount: { type: [Number, String], default: 0 },
  hideTreeLine: { type: Boolean, default: false },
  thinTreeLine: { type: Boolean, default: false },
});

const { resolvePermissions, resolveFeatureFlag, resolveInstallationType } =
  useSidebarContext();

const shouldRenderComponent = computed(() => {
  return typeof props.component === 'function' || isVNode(props.component);
});

// Tree-line connector per leaf: vertical line (::before) + rounded elbow on the
// last child (::after). Logical props (start / border-s / rounded-es)
const TREE_CONNECTOR =
  "child-item before:content-[''] before:absolute before:start-0 before:w-0.5 before:h-full before:bg-n-slate-4 first:before:rounded-t last:before:h-1/5 last:after:content-[''] last:after:absolute last:after:start-0 last:after:bottom-[calc(50%_-_2px)] last:after:h-3 last:after:w-2.5 last:after:border-b-2 last:after:border-s-2 last:after:rounded-es last:after:border-n-slate-4";
</script>

<template>
  <Policy
    :permissions="resolvePermissions(to)"
    :feature-flag="resolveFeatureFlag(to)"
    :installation-types="resolveInstallationType(to)"
    as="li"
    class="py-0.5 ps-2 ms-3 relative text-n-slate-11 min-w-0"
    :class="{
      [TREE_CONNECTOR]: !hideTreeLine,
      'before:!w-px last:after:!border-b last:after:!border-s':
        !hideTreeLine && thinTreeLine,
    }"
  >
    <component
      :is="to ? 'router-link' : 'div'"
      :to="to"
      :title="label"
      :aria-current="active ? 'page' : undefined"
      class="flex relative h-9 items-center gap-2 px-2 py-1 rounded-xl transition-all duration-150 ease-out hover:bg-n-alpha-2 hover:text-n-slate-12 group min-w-0"
      :class="{
        'text-n-blue-11 bg-n-brand/10 font-medium active': active,
      }"
    >
      <span
        v-if="active"
        aria-hidden="true"
        class="absolute inset-y-1 start-0 w-0.5 rounded-full bg-n-blue-11"
      />
      <component
        :is="component"
        v-if="shouldRenderComponent"
        v-bind="{ label, icon, active, badgeCount }"
      />
      <template v-else>
        <span v-if="icon" class="size-4 grid place-content-center rounded-full">
          <Icon
            :icon="icon"
            class="size-4 inline-block transition-colors"
            :class="{ 'text-n-blue-11': active }"
          />
        </span>
        <div class="flex-1 truncate min-w-0 text-sm">{{ label }}</div>
        <SidebarUnreadBadge :count="badgeCount" />
      </template>
    </component>
  </Policy>
</template>
