<script setup>
// [TODO] Use Teleport to move the modal to the end of the body
import { ref, computed, onMounted } from 'vue';
import { useEventListener } from '@vueuse/core';
import Button from 'dashboard/components-next/button/Button.vue';

const { modalType, closeOnBackdropClick, onClose } = defineProps({
  closeOnBackdropClick: { type: Boolean, default: true },
  showCloseButton: { type: Boolean, default: true },
  onClose: { type: Function, default: null },
  fullWidth: { type: Boolean, default: false },
  modalType: { type: String, default: 'centered' },
  size: { type: String, default: '' },
});

const emit = defineEmits(['close']);
const show = defineModel('show', { type: Boolean, default: false });

const modalClassName = computed(() => {
  const modalClassNameMap = {
    centered: '',
    'right-aligned': 'right-aligned',
  };

  return `modal-mask skip-context-menu ${modalClassNameMap[modalType] || ''}`;
});

// [TODO] Revisit this logic to use outside click directive
const mousedDownOnBackdrop = ref(false);

const handleMouseDown = () => {
  mousedDownOnBackdrop.value = true;
};

const close = () => {
  show.value = false;
  emit('close');
  onClose?.();
};

const onMouseUp = () => {
  if (mousedDownOnBackdrop.value) {
    mousedDownOnBackdrop.value = false;
    if (closeOnBackdropClick) {
      close();
    }
  }
};

const onKeydown = e => {
  if (show.value && e.code === 'Escape') {
    close();
    e.stopPropagation();
  }
};

useEventListener(document.body, 'mouseup', onMouseUp);
useEventListener(document, 'keydown', onKeydown);

onMounted(() => {
  if (import.meta.env.DEV && onClose && typeof onClose === 'function') {
    // eslint-disable-next-line no-console
    console.warn(
      "[DEPRECATED] The 'onClose' prop is deprecated. Please use the 'close' event instead."
    );
  }
});
</script>

<template>
  <transition name="modal-fade">
    <div
      v-if="show"
      :class="modalClassName"
      transition="modal"
      @mousedown="handleMouseDown"
    >
      <div
        class="relative bg-n-alpha-3 shadow-md modal-container rtl:text-right skip-context-menu"
        :class="{
          'flex flex-col overflow-hidden rounded-2xl border border-n-weak w-full max-w-[37.5rem] mx-4 max-h-[90dvh]':
            !fullWidth,
          'items-center overflow-auto rounded-none flex h-full justify-center w-full max-h-full':
            fullWidth,
          [size]: true,
        }"
        @mouse.stop
        @mousedown="event => event.stopPropagation()"
      >
        <Button
          v-if="showCloseButton"
          ghost
          slate
          icon="i-lucide-x"
          class="absolute z-10 ltr:right-2 rtl:left-2 top-2"
          @click="close"
        />
        <!-- Scrolling lives on this wrapper so the absolutely pinned close
             button stays in view. `contents` keeps the full-width layout
             byte-identical by removing the wrapper from the box tree. -->
        <div :class="fullWidth ? 'contents' : 'flex-1 min-h-0 overflow-auto'">
          <slot />
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss">
.modal-mask {
  @apply flex items-center justify-center bg-n-alpha-black2 backdrop-blur-[4px] z-[9990] h-full left-0 fixed top-0 w-full;

  .modal-container {
    &.medium {
      @apply w-full max-w-[56.25rem];
    }

    // Nested so it outranks the `max-w-[37.5rem]` utility on the container.
    &.modal-big {
      @apply w-full max-w-none;
    }

    // .content-box {
    //   @apply h-auto p-0;
    // }
    .content {
      @apply p-6 sm:p-8;
    }

    form,
    .modal-content {
      @apply pt-4 pb-6 px-6 sm:pb-8 sm:px-8 self-center;

      a {
        @apply p-4;
      }

      .ProseMirror a {
        @apply p-0;
      }
    }
  }
}

.modal-mask.right-aligned {
  @apply justify-end;

  .modal-container {
    @apply rounded-none border-0 h-full max-h-none mx-0 w-full max-w-[30rem];
  }
}

.modal-enter,
.modal-leave {
  @apply opacity-0;
}

.modal-enter .modal-container,
.modal-leave .modal-container {
  transform: scale(1.1);
}
</style>
