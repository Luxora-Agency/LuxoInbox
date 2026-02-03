<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { useAlert } from 'dashboard/composables';
import SearchAPI from 'dashboard/api/search';
import NextButton from 'dashboard/components-next/button/Button.vue';
import Spinner from 'shared/components/Spinner.vue';
import Avatar from 'next/avatar/Avatar.vue';
import { debounce } from '@chatwoot/utils';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  message: {
    type: Object,
    required: true,
  },
  conversationId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['close', 'update:show']);

const { t } = useI18n();
const store = useStore();

const searchQuery = ref('');
const searchResults = ref([]);
const selectedConversations = ref([]);
const isSearching = ref(false);
const isForwarding = ref(false);
const initialConversations = ref([]);
const isLoadingInitial = ref(false);

const localShow = computed({
  get() {
    return props.show;
  },
  set(value) {
    emit('update:show', value);
  },
});

const hasSelectedConversations = computed(() => {
  return selectedConversations.value.length > 0;
});

const displayedConversations = computed(() => {
  const conversations =
    searchQuery.value.length >= 2
      ? searchResults.value
      : initialConversations.value;
  return conversations.filter(
    conversation => conversation.id !== props.conversationId
  );
});

const loadInitialConversations = async () => {
  isLoadingInitial.value = true;
  try {
    // Get conversations from store first
    const storeConversations = store.getters.getAllConversations || [];
    if (storeConversations.length > 0) {
      initialConversations.value = storeConversations;
    }
    // Also fetch recent conversations via search API for more complete results
    const { data } = await SearchAPI.conversations({ q: '' });
    if (data.payload && data.payload.length > 0) {
      // Merge store conversations with search results, removing duplicates
      const merged = [...initialConversations.value];
      data.payload.forEach(conv => {
        if (!merged.some(c => c.id === conv.id)) {
          merged.push(conv);
        }
      });
      initialConversations.value = merged;
    }
  } catch {
    // If API fails, keep using store conversations
  } finally {
    isLoadingInitial.value = false;
  }
};

const searchConversations = debounce(async query => {
  if (!query || query.length < 2) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;
  try {
    const { data } = await SearchAPI.conversations({ q: query });
    searchResults.value = data.payload || [];
  } catch {
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}, 300);

// Load conversations when modal opens
watch(
  () => props.show,
  newShow => {
    if (newShow) {
      loadInitialConversations();
    }
  },
  { immediate: true }
);

watch(searchQuery, newQuery => {
  searchConversations(newQuery);
});

const isSelected = conversationId => {
  return selectedConversations.value.some(c => c.id === conversationId);
};

const toggleSelection = conversation => {
  const index = selectedConversations.value.findIndex(
    c => c.id === conversation.id
  );
  if (index === -1) {
    selectedConversations.value.push(conversation);
  } else {
    selectedConversations.value.splice(index, 1);
  }
};

const removeSelection = conversationId => {
  selectedConversations.value = selectedConversations.value.filter(
    c => c.id !== conversationId
  );
};

const getConversationLabel = conversation => {
  const contact = conversation.meta?.sender;
  if (contact?.name) {
    return `#${conversation.id} - ${contact.name}`;
  }
  return `#${conversation.id}`;
};

const getConversationThumbnail = conversation => {
  return conversation.meta?.sender?.thumbnail || '';
};

const onClose = () => {
  searchQuery.value = '';
  searchResults.value = [];
  selectedConversations.value = [];
  initialConversations.value = [];
  emit('close');
};

const onForward = async () => {
  if (!hasSelectedConversations.value) return;

  isForwarding.value = true;
  try {
    const targetIds = selectedConversations.value.map(c => c.id);
    await store.dispatch('forwardMessage', {
      conversationId: props.conversationId,
      messageId: props.message.id,
      targetConversationIds: targetIds,
    });
    useAlert(t('CONVERSATION.FORWARD.SUCCESS', { count: targetIds.length }));
    onClose();
  } catch (error) {
    useAlert(t('CONVERSATION.FORWARD.ERROR'));
  } finally {
    isForwarding.value = false;
  }
};
</script>

<template>
  <woot-modal v-model:show="localShow" :on-close="onClose">
    <div class="flex flex-col h-auto overflow-auto max-h-[70vh]">
      <woot-modal-header :header-title="$t('CONVERSATION.FORWARD.TITLE')" />

      <div class="px-8 pb-8">
        <div class="mb-4">
          <input
            v-model="searchQuery"
            type="text"
            class="w-full"
            :placeholder="$t('CONVERSATION.FORWARD.SEARCH_PLACEHOLDER')"
          />
        </div>

        <div
          v-if="selectedConversations.length > 0"
          class="flex flex-wrap gap-2 mb-4"
        >
          <span
            v-for="conversation in selectedConversations"
            :key="conversation.id"
            class="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-woot-50 dark:bg-woot-800 text-woot-600 dark:text-woot-100"
          >
            {{ getConversationLabel(conversation) }}
            <button
              class="ml-1 text-woot-600 dark:text-woot-100 hover:text-woot-800 dark:hover:text-woot-50"
              @click="removeSelection(conversation.id)"
            >
              <span class="i-lucide-x size-3" />
            </button>
          </span>
        </div>

        <div class="min-h-[200px] max-h-[300px] overflow-y-auto">
          <div
            v-if="isSearching || isLoadingInitial"
            class="flex items-center justify-center h-[200px]"
          >
            <Spinner size="" />
          </div>

          <div
            v-else-if="displayedConversations.length === 0"
            class="flex items-center justify-center h-[200px] text-n-slate-11"
          >
            {{ $t('CONVERSATION.FORWARD.NO_RESULTS') }}
          </div>

          <ul v-else class="space-y-1">
            <li
              v-for="conversation in displayedConversations"
              :key="conversation.id"
              class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-n-slate-2 dark:hover:bg-n-solid-3"
              :class="{
                'bg-woot-25 dark:bg-woot-800': isSelected(conversation.id),
              }"
              @click="toggleSelection(conversation)"
            >
              <input
                type="checkbox"
                :checked="isSelected(conversation.id)"
                class="cursor-pointer"
                @click.stop
                @change="toggleSelection(conversation)"
              />
              <Avatar
                :src="getConversationThumbnail(conversation)"
                :name="conversation.meta?.sender?.name || ''"
                :size="32"
                rounded-full
              />
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate text-n-slate-12">
                  {{ getConversationLabel(conversation) }}
                </div>
                <div class="text-sm truncate text-n-slate-11">
                  {{ conversation.meta?.sender?.email || '' }}
                </div>
              </div>
            </li>
          </ul>
        </div>

        <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-n-strong">
          <NextButton
            faded
            slate
            :label="$t('CONVERSATION.FORWARD.CANCEL')"
            @click="onClose"
          />
          <NextButton
            :label="$t('CONVERSATION.FORWARD.FORWARD')"
            :disabled="!hasSelectedConversations || isForwarding"
            :is-loading="isForwarding"
            @click="onForward"
          />
        </div>
      </div>
    </div>
  </woot-modal>
</template>
