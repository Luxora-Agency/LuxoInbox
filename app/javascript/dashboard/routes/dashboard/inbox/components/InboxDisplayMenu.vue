<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import wootConstants from 'dashboard/constants/globals';
import { useUISettings } from 'dashboard/composables/useUISettings';
import NextButton from 'dashboard/components-next/button/Button.vue';

const emit = defineEmits(['filter']);

const { t } = useI18n();
const { uiSettings, updateUISettings } = useUISettings();

const showSortMenu = ref(false);
const activeSort = ref(wootConstants.INBOX_SORT_BY.NEWEST);
const activeDisplayFilter = ref({
  status: '',
  type: '',
});

const displayOptions = ref([
  {
    name: t('INBOX.DISPLAY_MENU.DISPLAY_OPTIONS.SNOOZED'),
    key: wootConstants.INBOX_DISPLAY_BY.SNOOZED,
    selected: false,
    type: wootConstants.INBOX_FILTER_TYPE.STATUS,
    icon: 'i-lucide-clock',
  },
  {
    name: t('INBOX.DISPLAY_MENU.DISPLAY_OPTIONS.READ'),
    key: wootConstants.INBOX_DISPLAY_BY.READ,
    selected: false,
    type: wootConstants.INBOX_FILTER_TYPE.TYPE,
    icon: 'i-lucide-mail-open',
  },
]);

const sortOptions = [
  {
    name: t('INBOX.DISPLAY_MENU.SORT_OPTIONS.NEWEST'),
    key: wootConstants.INBOX_SORT_BY.NEWEST,
    type: wootConstants.INBOX_FILTER_TYPE.SORT_ORDER,
  },
  {
    name: t('INBOX.DISPLAY_MENU.SORT_OPTIONS.OLDEST'),
    key: wootConstants.INBOX_SORT_BY.OLDEST,
    type: wootConstants.INBOX_FILTER_TYPE.SORT_ORDER,
  },
];

const activeSortOption = computed(() => {
  return (
    sortOptions.find(option => option.key === activeSort.value)?.name || ''
  );
});

const saveSelectedDisplayFilter = () => {
  updateUISettings({
    inbox_filter_by: {
      ...activeDisplayFilter.value,
      sort_by: activeSort.value || wootConstants.INBOX_SORT_BY.NEWEST,
    },
  });
};

const updateDisplayOption = option => {
  displayOptions.value.forEach(displayOption => {
    if (displayOption.key === option.key) {
      displayOption.selected = !option.selected;
      activeDisplayFilter.value[displayOption.type] = displayOption.selected
        ? displayOption.key
        : '';
      saveSelectedDisplayFilter();
      emit('filter', option);
    }
  });
};

const openSortMenu = () => {
  showSortMenu.value = !showSortMenu.value;
};

const onSortOptionClick = option => {
  activeSort.value = option.key;
  showSortMenu.value = false;
  saveSelectedDisplayFilter();
  emit('filter', option);
};

const setSavedFilter = () => {
  const { inbox_filter_by: filterBy = {} } = uiSettings.value;
  const { status, type, sort_by: sortBy } = filterBy;
  activeSort.value = sortBy || wootConstants.INBOX_SORT_BY.NEWEST;
  displayOptions.value.forEach(option => {
    option.selected =
      option.type === wootConstants.INBOX_FILTER_TYPE.STATUS
        ? option.key === status
        : option.key === type;
    activeDisplayFilter.value[option.type] = option.selected ? option.key : '';
  });
};

onMounted(setSavedFilter);
</script>

<template>
  <div
    class="flex flex-col max-w-64 min-w-[200px] w-fit bg-white dark:bg-n-solid-3 border border-n-weak dark:border-n-strong shadow-xl shadow-black/10 dark:shadow-black/40 rounded-xl overflow-hidden"
  >
    <!-- Sort section -->
    <div
      class="flex items-center gap-3 justify-between p-3 h-14 bg-n-slate-2 dark:bg-n-solid-2 border-b border-n-weak dark:border-n-strong"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div
          class="flex items-center justify-center w-7 h-7 rounded-lg bg-woot-500/10 dark:bg-woot-500/20"
        >
          <span class="i-lucide-arrow-down-up size-3.5 text-woot-500" />
        </div>
        <span class="text-sm font-medium text-n-slate-12 truncate min-w-0">
          {{ t('INBOX.DISPLAY_MENU.SORT') }}
        </span>
      </div>
      <div v-on-clickaway="() => (showSortMenu = false)" class="relative">
        <NextButton
          :label="activeSortOption"
          icon="i-lucide-chevron-down"
          slate
          trailing-icon
          xs
          faded
          class="w-fit min-w-20 max-w-32"
          @click="openSortMenu"
        />
        <div
          v-if="showSortMenu"
          class="absolute flex flex-col gap-0.5 p-1 w-fit min-w-24 top-full mt-1 bg-white dark:bg-n-solid-3 border border-n-weak dark:border-n-strong shadow-lg rounded-lg z-10"
        >
          <div
            v-for="option in sortOptions"
            :key="option.key"
            role="button"
            class="flex rounded-lg h-8 w-full items-center justify-between px-3 py-1.5 gap-2 whitespace-nowrap transition-colors duration-200 hover:bg-n-slate-3 dark:hover:bg-n-solid-2"
            :class="{
              'bg-woot-500/10 dark:bg-woot-500/20': activeSort === option.key,
            }"
            @click.stop="onSortOptionClick(option)"
          >
            <span
              class="text-sm font-medium truncate min-w-0 transition-colors"
              :class="{
                'text-woot-500': activeSort === option.key,
                'text-n-slate-12': activeSort !== option.key,
              }"
            >
              {{ option.name }}
            </span>
            <span
              v-if="activeSort === option.key"
              class="i-lucide-check size-3.5 flex-shrink-0 text-woot-500"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Display options section -->
    <div class="p-3 bg-white dark:bg-n-solid-3">
      <span
        class="text-xs font-medium text-n-slate-10 uppercase tracking-wider"
      >
        {{ t('INBOX.DISPLAY_MENU.DISPLAY') }}
      </span>
      <div class="flex flex-col gap-1 mt-2">
        <label
          v-for="option in displayOptions"
          :key="option.key"
          :for="option.key"
          class="flex items-center px-3 py-2.5 gap-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-n-slate-3 dark:hover:bg-n-solid-2"
          :class="{
            'bg-woot-500/10 dark:bg-woot-500/15': option.selected,
          }"
        >
          <input
            :id="option.key"
            type="checkbox"
            :name="option.key"
            :checked="option.selected"
            class="sr-only peer"
            @change="updateDisplayOption(option)"
          />
          <div
            class="flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-200 border-n-slate-6 dark:border-n-slate-8 peer-checked:border-woot-500 peer-checked:bg-woot-500"
          >
            <span
              v-if="option.selected"
              class="i-lucide-check size-3 text-white"
            />
          </div>
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="size-4 flex-shrink-0"
              :class="[
                option.icon,
                option.selected ? 'text-woot-500' : 'text-n-slate-11',
              ]"
            />
            <span
              class="text-sm font-medium transition-colors"
              :class="option.selected ? 'text-woot-500' : 'text-n-slate-12'"
            >
              {{ option.name }}
            </span>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>
