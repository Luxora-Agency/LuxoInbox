<script setup>
import { computed, onMounted, onUnmounted, watch, nextTick, ref } from 'vue';
import {
  useSidebarContext,
  usePopoverState,
  dropEmptySections,
} from './provider';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useMapGetter } from 'dashboard/composables/store';
import Policy from 'dashboard/components/policy.vue';
import Icon from 'next/icon/Icon.vue';
import SidebarGroupHeader from './SidebarGroupHeader.vue';
import SidebarGroupLeaf from './SidebarGroupLeaf.vue';
import SidebarSubGroup from './SidebarSubGroup.vue';
import SidebarGroupEmptyLeaf from './SidebarGroupEmptyLeaf.vue';
import SidebarSectionHeading from './SidebarSectionHeading.vue';
import SidebarCollapsedPopover from './SidebarCollapsedPopover.vue';

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: [String, Object, Function], default: null },
  to: { type: Object, default: null },
  activeOn: { type: Array, default: () => [] },
  children: { type: Array, default: undefined },
  getterKeys: { type: Object, default: () => ({}) },
  hasAlert: { type: Boolean, default: false },
});

const {
  expandedItem,
  setExpandedItem,
  resolvePath,
  resolvePermissions,
  resolveFeatureFlag,
  resolveInstallationType,
  isAllowed,
  isCollapsed,
  isResizing,
} = useSidebarContext();

const { t } = useI18n();

const {
  activePopover,
  setActivePopover,
  closeActivePopover,
  scheduleClose,
  cancelClose,
} = usePopoverState();

const navigableChildren = computed(() => {
  return (
    props.children
      ?.flatMap(child => child.children || child)
      .filter(child => !child.section) || []
  );
});

const isRTL = useMapGetter('accounts/isRTL');
const dynamicCount = useMapGetter(props.getterKeys.count);

// Rail mode hides labels and popover badges, so the icon carries the signal.
const railCount = computed(() => {
  const count = Number(dynamicCount.value);
  if (!Number.isFinite(count) || count <= 0) return '';

  return count > 99 ? '99+' : String(count);
});

// Stable hook for the guided tours. The rail and the expanded header are
// mutually exclusive, so the anchor resolves to exactly one node either way.
const tourSlug = computed(() => props.name.toLowerCase().replace(/\s+/g, '-'));
const tourAnchor = computed(() => `sidebar-${tourSlug.value}`);

const route = useRoute();
const router = useRouter();
const isExpanded = computed(() => expandedItem.value === props.name);
const isExpandable = computed(() => props.children);
const hasChildren = computed(
  () => Array.isArray(props.children) && props.children.length > 0
);

// Use shared popover state - only one popover can be open at a time
const isPopoverOpen = computed(() => activePopover.value === props.name);
// The rail hides the label, so the accessible name has to carry the alert state
// that the expanded tree shows on the inbox leaf.
const railLabel = computed(() =>
  props.hasAlert ? `${props.label}: ${t('SIDEBAR.REAUTHORIZE')}` : props.label
);
// The popover already names the group, so the tooltip steps aside while it is
// open. `disabled` keeps the instance alive; blanking the content destroys it.
const railTooltip = computed(() => ({
  content: railLabel.value,
  disabled: isPopoverOpen.value,
  placement: isRTL.value ? 'left' : 'right',
}));
const triggerRef = ref(null);
const triggerRect = ref({ top: 0, left: 0, bottom: 0, right: 0 });
// The sort dropdown teleports outside the popover; keep the popover open while
// it is showing so moving the cursor onto it does not close everything.
const isSortMenuOpen = ref(false);

const openPopover = () => {
  if (triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect();
    triggerRect.value = {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
    };
  }
  setActivePopover(props.name);
};

const closePopover = () => {
  if (activePopover.value === props.name) {
    closeActivePopover();
  }
};

const handleMouseEnter = () => {
  if (!hasChildren.value || isResizing.value) return;
  cancelClose();
  openPopover();
};

const handleMouseLeave = () => {
  if (!hasChildren.value || isSortMenuOpen.value) return;
  scheduleClose(250);
};

const handlePopoverMouseEnter = () => {
  cancelClose();
};

const handlePopoverMouseLeave = () => {
  if (isSortMenuOpen.value) return;
  scheduleClose(250);
};

const handleSortToggle = isOpen => {
  isSortMenuOpen.value = isOpen;
  cancelClose();
};

// Close popover when mouse leaves the window
const handleWindowBlur = () => {
  closeActivePopover();
};

const hasAccessibleSubChildren = child => {
  return child.children?.some(
    subChild => subChild.to && isAllowed(subChild.to)
  );
};

const visibleChildren = computed(() => {
  if (!hasChildren.value) return [];

  const children = props.children.filter(child => {
    if (child.section) return true;
    if (child.children) return hasAccessibleSubChildren(child);

    return child.to && isAllowed(child.to);
  });

  return dropEmptySections(children);
});

const accessibleItems = computed(() => {
  if (!hasChildren.value) return [];

  return visibleChildren.value
    .flatMap(child => child.children || child)
    .filter(child => child.to && isAllowed(child.to));
});

const hasAccessibleChildren = computed(() => {
  return visibleChildren.value.length > 0;
});

const isLastVisibleChild = child => {
  const lastChild = visibleChildren.value[visibleChildren.value.length - 1];
  return lastChild === child;
};

const isActive = computed(() => {
  if (props.to) {
    if (route.path === resolvePath(props.to)) return true;

    return props.activeOn.includes(route.name);
  }

  return false;
});

// We could use the RouterLink isActive too, but our routes are not always
// nested correctly, so we need to check the active state ourselves
// TODO: Audit the routes and fix the nesting and remove this
const activeChild = computed(() => {
  const pathSame = navigableChildren.value.find(
    child => child.to && route.path === resolvePath(child.to)
  );
  if (pathSame) return pathSame;

  // Rank the activeOn Prop higher than the path match
  // There will be cases where the path name is the same but the params are different
  // So we need to rank them based on the params
  // For example, contacts segment list in the sidebar effectively has the same name
  // But the params are different
  const activeOnPages = navigableChildren.value.filter(child =>
    child.activeOn?.includes(route.name)
  );

  if (activeOnPages.length > 0) {
    const rankedPage = activeOnPages.find(child => {
      return Object.keys(child.to.params)
        .map(key => {
          return String(child.to.params[key]) === String(route.params[key]);
        })
        .every(match => match);
    });

    // If there is no ranked page, return the first activeOn page anyway
    // Since this takes higher precedence over the path match
    // This is not perfect, ideally we should rank each route based on all the techniques
    // and then return the highest ranked one
    // But this is good enough for now
    return rankedPage ?? activeOnPages[0];
  }

  return navigableChildren.value.find(child => {
    if (!child.to) return false;
    const childPath = resolvePath(child.to);
    return route.path === childPath || route.path.startsWith(`${childPath}/`);
  });
});

const hasActiveChild = computed(() => {
  return activeChild.value !== undefined;
});

// The children collapse by animating the grid row to zero, which clips them but
// keeps them focusable, so visibility takes them out of the tab order as well.
const showChildren = computed(() => isExpanded.value || hasActiveChild.value);

const handleCollapsedClick = () => {
  if (hasChildren.value && hasAccessibleChildren.value) {
    const firstItem = accessibleItems.value[0];
    router.push(firstItem.to);
  }
};

// Headers only open and close their own group; navigation stays with the leaves
// and with the rail icons, which have no other way to reach a destination.
// Expandable groups toggle even with no accessible children so the empty-state
// leaf stays reachable.
const toggleTrigger = () => {
  if (!isExpandable.value) return;

  setExpandedItem(props.name);
};

// The active route claims the slot without persisting: only a click is a user
// preference, so this writes the shared ref instead of going through
// setExpandedItem, which would overwrite the stored group.
const claimExpandedSlot = () => {
  expandedItem.value = props.name;
};

onMounted(async () => {
  await nextTick();
  if (hasActiveChild.value && !isExpanded.value) {
    claimExpandedSlot();
  }
  window.addEventListener('blur', handleWindowBlur);
  document.addEventListener('mouseleave', handleWindowBlur);
});

onUnmounted(() => {
  window.removeEventListener('blur', handleWindowBlur);
  document.removeEventListener('mouseleave', handleWindowBlur);
});

watch(
  hasActiveChild,
  hasNewActiveChild => {
    if (hasNewActiveChild && !isExpanded.value) {
      claimExpandedSlot();
    }
  },
  { once: true }
);
</script>

<!-- eslint-disable-next-line vue/no-root-v-if -->
<template>
  <Policy
    v-if="!hasChildren || hasAccessibleChildren"
    :permissions="resolvePermissions(to)"
    :feature-flag="resolveFeatureFlag(to)"
    :installation-types="resolveInstallationType(to)"
    as="li"
    class="grid text-sm cursor-pointer select-none min-w-0"
  >
    <!-- Collapsed State -->
    <template v-if="isCollapsed">
      <div
        class="relative"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <component
          :is="to && !hasChildren ? 'router-link' : 'button'"
          ref="triggerRef"
          v-tooltip="railTooltip"
          :data-tour="tourAnchor"
          :to="to && !hasChildren ? to : undefined"
          type="button"
          class="flex relative items-center justify-center size-10 rounded-lg"
          :class="{
            'text-n-blue-11 bg-n-brand/10': isActive || hasActiveChild,
            'text-n-slate-11 hover:bg-n-alpha-2': !isActive && !hasActiveChild,
          }"
          :aria-label="railLabel"
          :aria-current="isActive && to && !hasChildren ? 'page' : undefined"
          @click="hasChildren ? handleCollapsedClick() : undefined"
        >
          <span
            v-if="isActive || hasActiveChild"
            aria-hidden="true"
            class="absolute inset-y-1 start-0 w-0.5 rounded-full bg-n-blue-11"
          />
          <span class="grid relative place-content-center">
            <Icon v-if="icon" :icon="icon" class="size-4" />
            <span
              v-if="railCount"
              aria-hidden="true"
              class="absolute -top-1.5 ltr:-right-2 rtl:-left-2 grid h-4 min-w-4 place-items-center rounded-full bg-n-brand px-1 text-[10px] font-medium leading-none text-orbis-navy"
            >
              {{ railCount }}
            </span>
            <span
              v-if="hasAlert"
              aria-hidden="true"
              class="absolute -bottom-1.5 ltr:-right-1.5 rtl:-left-1.5 size-2 rounded-full bg-n-ruby-9 ring-1 ring-n-background"
            />
          </span>
        </component>
        <SidebarCollapsedPopover
          v-if="hasChildren && isPopoverOpen"
          :label="label"
          :children="children"
          :active-child="activeChild"
          :trigger-rect="triggerRect"
          @close="closePopover"
          @mouseenter="handlePopoverMouseEnter"
          @mouseleave="handlePopoverMouseLeave"
          @sort-toggle="handleSortToggle"
        />
      </div>
    </template>
    <!-- Expanded State -->
    <template v-else>
      <SidebarGroupHeader
        :icon
        :name
        :label
        :to
        :getter-keys="getterKeys"
        :is-active="isActive"
        :has-active-child="hasActiveChild"
        :expandable="hasChildren"
        :is-expanded="isExpanded"
        @toggle="toggleTrigger"
      />
      <div
        v-if="hasChildren"
        class="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
        :class="showChildren ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
      >
        <ul
          class="grid overflow-hidden pt-1 m-0 list-none min-w-0 transition-[visibility] duration-200 ease-out motion-reduce:transition-none"
          :class="showChildren ? 'visible' : 'invisible'"
        >
          <template v-for="child in visibleChildren" :key="child.name">
            <SidebarSectionHeading
              v-if="child.section"
              v-show="isExpanded"
              :label="child.label"
            />
            <SidebarSubGroup
              v-else-if="child.children"
              :name="`${name}:${child.name}`"
              :label="child.label"
              :icon="child.icon"
              :children="child.children"
              :collapsible="child.collapsible"
              :show-tree-line="child.showTreeLine"
              :end-tree-line="child.showTreeLine && isLastVisibleChild(child)"
              :is-expanded="isExpanded"
              :active-child="activeChild"
              :sort-options="child.sortOptions"
              :active-sort="child.activeSort"
              @update-sort="child.onSortChange"
            />
            <SidebarGroupLeaf
              v-else-if="isAllowed(child.to)"
              v-show="isExpanded || activeChild?.name === child.name"
              v-bind="child"
              :tour-scope="tourSlug"
              :active="activeChild?.name === child.name"
            />
          </template>
        </ul>
      </div>
      <ul v-else-if="isExpandable && isExpanded" class="pt-1">
        <SidebarGroupEmptyLeaf />
      </ul>
    </template>
  </Policy>
</template>
