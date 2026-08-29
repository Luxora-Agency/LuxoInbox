<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import SignupForm from './components/Signup/Form.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import OrbisShell from '../../../components/Auth/OrbisShell.vue';
import OrbisPanel from '../../../components/Auth/OrbisPanel.vue';
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
  <OrbisShell
    :hero-accent="globalConfig.installationName"
    :hero-title="t('REGISTER.HERO.TITLE')"
    :hero-description="t('REGISTER.HERO.DESCRIPTION')"
  >
    <!-- Hero: logo mark -->
    <template #hero-top>
      <div
        class="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-[4px]"
      >
        <img
          :src="globalConfig.logo"
          :alt="globalConfig.installationName"
          class="size-7 object-contain"
        />
      </div>
    </template>

    <!-- Hero: feature list -->
    <template #hero-features>
      <div class="mt-12 space-y-4">
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon icon="i-lucide-rocket" class="size-[18px] text-orbis-neon" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('REGISTER.HERO.FEATURE_1') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon icon="i-lucide-users" class="size-[18px] text-orbis-neon" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('REGISTER.HERO.FEATURE_2') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon
              icon="i-lucide-sparkles"
              class="size-[18px] text-orbis-neon"
            />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('REGISTER.HERO.FEATURE_3') }}
          </span>
        </div>
      </div>
    </template>

    <!-- Hero: trust badge -->
    <template #hero-bottom>
      <OrbisPanel class="p-6">
        <p class="font-mono text-sm leading-relaxed text-orbis-cream/80">
          {{ t('REGISTER.HERO.TESTIMONIAL_TEXT') }}
        </p>
        <div class="mt-5 flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-full border border-orbis-neon/30 bg-orbis-neon/10 font-mono text-xs font-semibold text-orbis-neon"
          >
            {{ t('REGISTER.HERO.TESTIMONIAL_INITIALS') }}
          </div>
          <div>
            <p class="text-sm font-medium text-orbis-cream">
              {{ t('REGISTER.HERO.TESTIMONIAL_NAME') }}
            </p>
            <p
              class="font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-cream/45"
            >
              {{ t('REGISTER.HERO.TESTIMONIAL_ROLE') }}
            </p>
          </div>
        </div>
      </OrbisPanel>
    </template>

    <!-- Language Selector (Top Right) -->
    <template #top-right>
      <div
        ref="languageDropdownRef"
        class="absolute top-6 right-6 z-50 sm:top-8 sm:right-8"
      >
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-orbis-cream/55 transition-colors hover:bg-white/5 hover:text-orbis-cream"
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
            class="absolute right-0 z-50 mt-2 max-h-64 w-48 overflow-y-auto rounded-xl border border-white/10 bg-orbis-navy/95 py-1 shadow-2xl backdrop-blur-md"
          >
            <button
              v-for="lang in availableLanguages"
              :key="lang.code"
              type="button"
              class="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/5"
              :class="
                selectedLocale === lang.code
                  ? 'text-orbis-neon font-medium bg-orbis-neon/5'
                  : 'text-orbis-cream/75'
              "
              @click="changeLocale(lang.code)"
            >
              {{ lang.name }}
            </button>
          </div>
        </Transition>
      </div>
    </template>

    <!-- Mobile Logo -->
    <div class="mb-8 text-center lg:hidden">
      <img
        v-if="globalConfig.logoDark"
        :src="globalConfig.logoDark"
        :alt="globalConfig.installationName"
        class="mx-auto mb-4 h-10"
      />
      <img
        v-else
        :src="globalConfig.logo"
        :alt="globalConfig.installationName"
        class="mx-auto mb-4 h-10"
      />
    </div>

    <!-- Signup Form Container -->
    <OrbisPanel class="w-full max-w-md p-8 sm:p-10">
      <!-- Header -->
      <div class="mb-8">
        <h2
          class="font-anton text-3xl uppercase leading-none tracking-[0.01em] text-orbis-cream sm:text-4xl"
        >
          {{ t('REGISTER.GET_STARTED') }}
        </h2>
        <p
          class="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-cream/45"
        >
          {{ t('REGISTER.HAVE_AN_ACCOUNT') }}
          <router-link
            to="/app/login"
            class="text-orbis-neon transition-colors hover:text-orbis-neon/70"
          >
            {{ t('LOGIN.SUBMIT') }}
          </router-link>
        </p>
      </div>

      <!-- Signup Form -->
      <SignupForm />
    </OrbisPanel>
  </OrbisShell>
</template>
