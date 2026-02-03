<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import SignupForm from './components/Signup/Form.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import languages from 'dashboard/i18n';

const store = useStore();
const { t, locale } = useI18n();

const globalConfig = computed(() => store.getters['globalConfig/get']);

// Language selector
const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt_BR: 'Português (Brasil)',
  pt: 'Português',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  zh_CN: '简体中文',
  zh_TW: '繁體中文',
  ru: 'Русский',
  ar: 'العربية',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  hi: 'हिन्दी',
  id: 'Bahasa Indonesia',
};

const selectedLocale = ref(window.chatwootConfig.selectedLocale || 'en');
const showLanguageDropdown = ref(false);
const languageDropdownRef = ref(null);

const availableLanguages = computed(() =>
  Object.keys(languages).map(code => ({
    code,
    name: LANGUAGE_NAMES[code] || code,
  }))
);

const currentLanguageName = computed(
  () => LANGUAGE_NAMES[selectedLocale.value] || selectedLocale.value
);

const changeLocale = localeCode => {
  selectedLocale.value = localeCode;
  locale.value = localeCode;
  showLanguageDropdown.value = false;
};

const toggleLanguageDropdown = () => {
  showLanguageDropdown.value = !showLanguageDropdown.value;
};

const handleClickOutside = event => {
  if (
    languageDropdownRef.value &&
    !languageDropdownRef.value.contains(event.target)
  ) {
    showLanguageDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <main class="flex min-h-screen w-full">
    <!-- Left Panel - Branding & Features -->
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
          <h1
            class="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4"
          >
            {{ t('REGISTER.HERO.TITLE') }}
          </h1>
          <p class="text-lg text-white/80 mb-10 max-w-md">
            {{ t('REGISTER.HERO.DESCRIPTION') }}
          </p>

          <!-- Features List -->
          <div class="space-y-5">
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <Icon icon="i-lucide-rocket" class="size-5 text-white" />
              </div>
              <span class="text-white font-medium">
                {{ t('REGISTER.HERO.FEATURE_1') }}
              </span>
            </div>
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <Icon icon="i-lucide-users" class="size-5 text-white" />
              </div>
              <span class="text-white font-medium">
                {{ t('REGISTER.HERO.FEATURE_2') }}
              </span>
            </div>
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <Icon icon="i-lucide-sparkles" class="size-5 text-white" />
              </div>
              <span class="text-white font-medium">
                {{ t('REGISTER.HERO.FEATURE_3') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Trust Badge -->
        <div
          class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <p class="text-white/90 italic mb-4 leading-relaxed">
            {{ t('REGISTER.HERO.TESTIMONIAL_TEXT') }}
          </p>
          <div class="flex items-center gap-3">
            <div
              class="size-10 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            >
              {{ t('REGISTER.HERO.TESTIMONIAL_INITIALS') }}
            </div>
            <div>
              <p class="text-white font-medium text-sm">
                {{ t('REGISTER.HERO.TESTIMONIAL_NAME') }}
              </p>
              <p class="text-white/60 text-xs">
                {{ t('REGISTER.HERO.TESTIMONIAL_ROLE') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Right Panel - Signup Form -->
    <section
      class="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-n-background dark:bg-n-background relative"
    >
      <!-- Language Selector (Top Right) -->
      <div
        ref="languageDropdownRef"
        class="absolute top-6 right-6 sm:top-8 sm:right-8"
      >
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 text-sm text-n-slate-11 hover:text-n-slate-12 hover:bg-n-alpha-2 rounded-lg transition-colors"
          @click="toggleLanguageDropdown"
        >
          <Icon icon="i-lucide-globe" class="size-4" />
          <span class="hidden sm:inline">{{ currentLanguageName }}</span>
          <Icon
            icon="i-lucide-chevron-down"
            class="size-3.5 transition-transform"
            :class="{ 'rotate-180': showLanguageDropdown }"
          />
        </button>
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-if="showLanguageDropdown"
            class="absolute right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-white dark:bg-n-solid-3 rounded-xl shadow-lg ring-1 ring-n-weak/50 dark:ring-n-weak/30 py-1 z-50"
          >
            <button
              v-for="lang in availableLanguages"
              :key="lang.code"
              type="button"
              class="w-full px-4 py-2 text-left text-sm hover:bg-n-alpha-2 transition-colors"
              :class="
                selectedLocale === lang.code
                  ? 'text-n-brand font-medium bg-n-brand/5'
                  : 'text-n-slate-12'
              "
              @click="changeLocale(lang.code)"
            >
              {{ lang.name }}
            </button>
          </div>
        </Transition>
      </div>

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

      <!-- Signup Form Container -->
      <div class="w-full max-w-md">
        <!-- Header -->
        <div class="text-center mb-8">
          <h2
            class="text-2xl sm:text-3xl font-bold tracking-tight text-n-slate-12 mb-2"
          >
            {{ t('REGISTER.GET_STARTED') }}
          </h2>
          <p class="text-n-slate-11">
            {{ t('REGISTER.HAVE_AN_ACCOUNT') }}
            <router-link
              to="/app/login"
              class="text-n-brand hover:text-n-brand/80 font-semibold transition-colors"
            >
              {{ t('LOGIN.SUBMIT') }}
            </router-link>
          </p>
        </div>

        <!-- Signup Form -->
        <SignupForm />
      </div>
    </section>
  </main>
</template>
