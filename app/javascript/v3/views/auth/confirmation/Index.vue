<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { DEFAULT_REDIRECT_URL } from 'dashboard/constants/globals';
import { verifyPasswordToken } from '../../../api/auth';
import Spinner from 'shared/components/Spinner.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';

const props = defineProps({
  confirmationToken: {
    type: String,
    default: '',
  },
});

const store = useStore();
const { t } = useI18n();

const globalConfig = computed(() => store.getters['globalConfig/get']);

const confirmToken = async () => {
  try {
    await verifyPasswordToken({
      confirmationToken: props.confirmationToken,
    });
    window.location = DEFAULT_REDIRECT_URL;
  } catch (error) {
    window.location = DEFAULT_REDIRECT_URL;
  }
};

confirmToken();
</script>

<template>
  <main class="flex min-h-screen w-full">
    <!-- Left Panel - Branding -->
    <aside
      class="hidden lg:flex lg:w-1/2 xl:w-[45%] bg-gradient-to-br from-[#4C1D95] via-[#86198F] to-[#9F1239] relative overflow-hidden"
    >
      <!-- Background Pattern -->
      <div
        class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40"
      />

      <!-- Gradient Overlay for depth -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
      />

      <!-- Decorative circles -->
      <div
        class="absolute -top-24 -right-24 w-96 h-96 bg-[#D946EF]/20 rounded-full blur-3xl"
      />
      <div
        class="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[#9333EA]/20 rounded-full blur-3xl"
      />

      <!-- Content -->
      <div class="relative z-10 flex flex-col justify-between p-10 xl:p-14">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center size-11 bg-white/20 backdrop-blur-sm rounded-xl"
          >
            <img
              :src="globalConfig.logo"
              :alt="globalConfig.installationName"
              class="w-7 h-7 object-contain"
            />
          </div>
          <span class="text-xl font-semibold text-white">
            {{ globalConfig.installationName }}
          </span>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col justify-center py-12">
          <div
            class="flex items-center justify-center size-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6"
          >
            <Icon icon="i-lucide-mail-check" class="size-8 text-white" />
          </div>
          <h1
            class="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4"
          >
            {{ t('CONFIRM_EMAIL_PAGE.HERO.TITLE') }}
          </h1>
          <p class="text-lg text-white/80 mb-10 max-w-md">
            {{ t('CONFIRM_EMAIL_PAGE.HERO.DESCRIPTION') }}
          </p>

          <!-- Steps -->
          <div class="space-y-5">
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <Icon icon="i-lucide-check" class="size-5 text-white" />
              </div>
              <span class="text-white font-medium">
                {{ t('CONFIRM_EMAIL_PAGE.HERO.STEP_1') }}
              </span>
            </div>
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <Icon icon="i-lucide-check" class="size-5 text-white" />
              </div>
              <span class="text-white font-medium">
                {{ t('CONFIRM_EMAIL_PAGE.HERO.STEP_2') }}
              </span>
            </div>
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/20 backdrop-blur-sm rounded-xl animate-pulse"
              >
                <Icon
                  icon="i-lucide-loader-2"
                  class="size-5 text-white animate-spin"
                />
              </div>
              <span class="text-white font-medium">
                {{ t('CONFIRM_EMAIL_PAGE.HERO.STEP_3') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Security Note -->
        <div
          class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 flex items-center gap-4"
        >
          <div
            class="size-12 bg-white/20 rounded-xl flex items-center justify-center"
          >
            <Icon icon="i-lucide-shield-check" class="size-6 text-white" />
          </div>
          <div>
            <p class="text-white font-medium text-sm">
              {{ t('CONFIRM_EMAIL_PAGE.HERO.SECURITY_TITLE') }}
            </p>
            <p class="text-white/60 text-xs">
              {{ t('CONFIRM_EMAIL_PAGE.HERO.SECURITY_DESC') }}
            </p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Right Panel - Confirmation -->
    <section
      class="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-n-background dark:bg-n-background"
    >
      <!-- Mobile Logo -->
      <div class="lg:hidden mb-8 text-center">
        <img
          :src="globalConfig.logo"
          :alt="globalConfig.installationName"
          class="h-10 mx-auto mb-4 dark:hidden"
        />
        <img
          v-if="globalConfig.logoDark"
          :src="globalConfig.logoDark"
          :alt="globalConfig.installationName"
          class="hidden h-10 mx-auto mb-4 dark:block"
        />
      </div>

      <!-- Confirmation Container -->
      <div class="w-full max-w-md text-center">
        <div
          class="inline-flex items-center justify-center size-14 bg-n-brand/10 dark:bg-n-brand/20 rounded-2xl mb-6"
        >
          <Icon icon="i-lucide-mail-check" class="size-7 text-n-brand" />
        </div>
        <h2
          class="text-2xl sm:text-3xl font-bold tracking-tight text-n-slate-12 mb-4"
        >
          {{ t('CONFIRM_EMAIL_PAGE.TITLE') }}
        </h2>
        <p class="text-n-slate-11 mb-8">
          {{ t('CONFIRM_EMAIL_PAGE.DESCRIPTION') }}
        </p>
        <Spinner color-scheme="primary" size="" />
      </div>
    </section>
  </main>
</template>
