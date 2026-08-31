<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { useAlert } from 'dashboard/composables';
import { required, minLength, email } from '@vuelidate/validators';
import { useBranding } from 'shared/composables/useBranding';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import FormInput from '../../../../components/Form/Input.vue';
import { resetPassword } from '../../../../api/auth';
import NextButton from 'dashboard/components-next/button/Button.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import OrbisShell from '../../../../components/Auth/OrbisShell.vue';
import OrbisPanel from '../../../../components/Auth/OrbisPanel.vue';
import languages from 'dashboard/i18n';

const store = useStore();
const { t, locale } = useI18n();
const { replaceInstallationName } = useBranding();

const credentials = ref({ email: '' });
const resetPasswordState = ref({
  message: '',
  showLoading: false,
});

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

const rules = {
  credentials: {
    email: {
      required,
      email,
      minLength: minLength(4),
    },
  },
};

const v$ = useVuelidate(rules, { credentials });
const globalConfig = computed(() => store.getters['globalConfig/get']);

const showAlertMessage = message => {
  resetPasswordState.value.showLoading = false;
  useAlert(message);
};

const submit = () => {
  resetPasswordState.value.showLoading = true;
  resetPassword(credentials.value)
    .then(res => {
      let successMessage = t('RESET_PASSWORD.API.SUCCESS_MESSAGE');
      if (res.data && res.data.message) {
        successMessage = res.data.message;
      }
      showAlertMessage(successMessage);
    })
    .catch(error => {
      let errorMessage = t('RESET_PASSWORD.API.ERROR_MESSAGE');
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      showAlertMessage(errorMessage);
    });
};
</script>

<template>
  <OrbisShell
    :hero-accent="globalConfig.installationName"
    :hero-title="t('RESET_PASSWORD.HERO.TITLE')"
    :hero-description="t('RESET_PASSWORD.HERO.DESCRIPTION')"
  >
    <!-- Hero: logo mark -->
    <template #hero-top>
      <div
        class="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-[4px]"
      >
        <img
          :src="globalConfig.logoThumbnail"
          :alt="globalConfig.installationName"
          class="size-7 object-contain"
        />
      </div>
    </template>

    <!-- Hero: steps -->
    <template #hero-features>
      <div class="mt-12 space-y-4">
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-orbis-neon/30 bg-orbis-neon/10 font-mono text-sm font-semibold text-orbis-neon"
          >
            {{ t('RESET_PASSWORD.HERO.STEP_NUMBER_1') }}
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('RESET_PASSWORD.HERO.STEP_1') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-orbis-neon/30 bg-orbis-neon/10 font-mono text-sm font-semibold text-orbis-neon"
          >
            {{ t('RESET_PASSWORD.HERO.STEP_NUMBER_2') }}
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('RESET_PASSWORD.HERO.STEP_2') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-orbis-neon/30 bg-orbis-neon/10 font-mono text-sm font-semibold text-orbis-neon"
          >
            {{ t('RESET_PASSWORD.HERO.STEP_NUMBER_3') }}
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('RESET_PASSWORD.HERO.STEP_3') }}
          </span>
        </div>
      </div>
    </template>

    <!-- Hero: security note -->
    <template #hero-bottom>
      <OrbisPanel class="flex items-center gap-4 p-5">
        <div
          class="flex size-12 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
        >
          <Icon icon="i-lucide-shield" class="size-6 text-orbis-neon" />
        </div>
        <div>
          <p class="text-sm font-medium text-orbis-cream">
            {{ t('RESET_PASSWORD.HERO.SECURITY_TITLE') }}
          </p>
          <p
            class="font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-cream/45"
          >
            {{ t('RESET_PASSWORD.HERO.SECURITY_DESC') }}
          </p>
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

    <!-- Reset Password Form Container -->
    <OrbisPanel class="w-full max-w-md p-8 sm:p-10">
      <!-- Header -->
      <div class="mb-8">
        <div
          class="mb-5 inline-flex size-12 items-center justify-center rounded-xl border border-orbis-neon/25 bg-orbis-neon/10"
        >
          <Icon icon="i-lucide-mail" class="size-6 text-orbis-neon" />
        </div>
        <h2
          class="font-anton text-3xl uppercase leading-none tracking-[0.01em] text-orbis-cream sm:text-4xl"
        >
          {{ t('RESET_PASSWORD.TITLE') }}
        </h2>
        <p class="mt-3 font-mono text-xs leading-relaxed text-orbis-cream/45">
          {{ replaceInstallationName(t('RESET_PASSWORD.DESCRIPTION')) }}
        </p>
      </div>

      <!-- Reset Form -->
      <form
        class="space-y-5 [&_label]:font-mono [&_label]:text-[11px] [&_label]:uppercase [&_label]:tracking-[0.18em] [&_label]:text-orbis-cream/70 [&_label.text-n-ruby-11]:!text-orbis-danger [&_.pointer-events-none]:text-orbis-cream/35 [&_input]:rounded-xl [&_input]:bg-white/5 [&_input]:text-orbis-cream [&_input]:placeholder:text-orbis-cream/30 [&_input:not(.error)]:outline-white/15 [&_input:not(.error):hover]:outline-white/30 [&_input:not(.error):focus]:outline-orbis-neon [&_input:not(.error):focus]:ring-orbis-neon/15 [&_input.error]:outline-orbis-danger [&_input.error:hover]:outline-orbis-danger [&_input.error:focus]:outline-orbis-danger [&_input.error:focus]:ring-orbis-danger/15"
        @submit.prevent="submit"
      >
        <FormInput
          v-model="credentials.email"
          name="email_address"
          icon="mail"
          :has-error="v$.credentials.email.$error"
          :error-message="t('RESET_PASSWORD.EMAIL.ERROR')"
          :label="t('RESET_PASSWORD.EMAIL.LABEL')"
          :placeholder="t('RESET_PASSWORD.EMAIL.PLACEHOLDER')"
          @input="v$.credentials.email.$touch"
        />
        <NextButton
          lg
          type="submit"
          data-testid="submit_button"
          class="w-full !rounded-xl bg-gradient-to-r from-[#b724ff] to-[#7c3aed] font-mono !text-sm uppercase tracking-[0.16em] !text-white transition-transform duration-200 hover:enabled:scale-[1.02]"
          :label="t('RESET_PASSWORD.SUBMIT')"
          :disabled="
            v$.credentials.email.$invalid || resetPasswordState.showLoading
          "
          :is-loading="resetPasswordState.showLoading"
        />
      </form>

      <!-- Back to Login -->
      <p class="mt-8 text-center">
        <router-link
          to="/app/login"
          class="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-neon transition-colors hover:text-orbis-neon/70"
        >
          <Icon icon="i-lucide-arrow-left" class="size-4" />
          {{ t('RESET_PASSWORD.BACK_TO_LOGIN') }}
        </router-link>
      </p>
    </OrbisPanel>
  </OrbisShell>
</template>
