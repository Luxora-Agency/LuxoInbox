<script>
// utils and composables
import { login } from '../../api/auth';
import { mapGetters } from 'vuex';
import { useAlert } from 'dashboard/composables';
import { required, email } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import { SESSION_STORAGE_KEYS } from 'dashboard/constants/sessionStorage';
import SessionStorage from 'shared/helpers/sessionStorage';
import { useBranding } from 'shared/composables/useBranding';
import languages from 'dashboard/i18n';

// components
import SimpleDivider from '../../components/Divider/SimpleDivider.vue';
import FormInput from '../../components/Form/Input.vue';
import GoogleOAuthButton from '../../components/GoogleOauth/Button.vue';
import Spinner from 'shared/components/Spinner.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import NextButton from 'dashboard/components-next/button/Button.vue';
import MfaVerification from 'dashboard/components/auth/MfaVerification.vue';

const ERROR_MESSAGES = {
  'no-account-found': 'LOGIN.OAUTH.NO_ACCOUNT_FOUND',
  'business-account-only': 'LOGIN.OAUTH.BUSINESS_ACCOUNTS_ONLY',
  'saml-authentication-failed': 'LOGIN.SAML.API.ERROR_MESSAGE',
  'saml-not-enabled': 'LOGIN.SAML.API.ERROR_MESSAGE',
};

const IMPERSONATION_URL_SEARCH_KEY = 'impersonation';

// Language display names
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

export default {
  components: {
    FormInput,
    GoogleOAuthButton,
    Spinner,
    NextButton,
    SimpleDivider,
    MfaVerification,
    Icon,
  },
  props: {
    ssoAuthToken: { type: String, default: '' },
    ssoAccountId: { type: String, default: '' },
    ssoConversationId: { type: String, default: '' },
    email: { type: String, default: '' },
    authError: { type: String, default: '' },
  },
  setup() {
    const { replaceInstallationName } = useBranding();
    return {
      replaceInstallationName,
      v$: useVuelidate(),
    };
  },
  data() {
    return {
      credentials: {
        email: '',
        password: '',
      },
      loginApi: {
        message: '',
        showLoading: false,
        hasErrored: false,
      },
      error: '',
      mfaRequired: false,
      mfaToken: null,
      selectedLocale: window.chatwootConfig.selectedLocale || 'en',
      showLanguageDropdown: false,
    };
  },
  validations() {
    return {
      credentials: {
        password: {
          required,
        },
        email: {
          required,
          email,
        },
      },
    };
  },
  computed: {
    ...mapGetters({ globalConfig: 'globalConfig/get' }),
    allowedLoginMethods() {
      return window.chatwootConfig.allowedLoginMethods || ['email'];
    },
    showGoogleOAuth() {
      return (
        this.allowedLoginMethods.includes('google_oauth') &&
        Boolean(window.chatwootConfig.googleOAuthClientId)
      );
    },
    showSignupLink() {
      return window.chatwootConfig.signupEnabled === 'true';
    },
    showSamlLogin() {
      return this.allowedLoginMethods.includes('saml');
    },
    availableLanguages() {
      return Object.keys(languages).map(code => ({
        code,
        name: LANGUAGE_NAMES[code] || code,
      }));
    },
    currentLanguageName() {
      return LANGUAGE_NAMES[this.selectedLocale] || this.selectedLocale;
    },
  },
  created() {
    if (this.ssoAuthToken) {
      this.submitLogin();
    }
    if (this.authError) {
      const messageKey = ERROR_MESSAGES[this.authError] ?? 'LOGIN.API.UNAUTH';
      const translatedMessage = this.getTranslatedMessage(messageKey);
      useAlert(translatedMessage);
      this.requestIdleCallbackPolyfill(() => {
        const { query } = this.$route;
        this.$router.replace({ query: { ...query, error: undefined } });
      });
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    getTranslatedMessage(key) {
      switch (key) {
        case 'LOGIN.OAUTH.NO_ACCOUNT_FOUND':
          return this.$t('LOGIN.OAUTH.NO_ACCOUNT_FOUND');
        case 'LOGIN.OAUTH.BUSINESS_ACCOUNTS_ONLY':
          return this.$t('LOGIN.OAUTH.BUSINESS_ACCOUNTS_ONLY');
        case 'LOGIN.API.UNAUTH':
        default:
          return this.$t('LOGIN.API.UNAUTH');
      }
    },
    requestIdleCallbackPolyfill(callback) {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(callback);
      } else {
        setTimeout(callback, 0);
      }
    },
    showAlertMessage(message) {
      this.loginApi.showLoading = false;
      this.loginApi.message = message;
      useAlert(this.loginApi.message);
    },
    handleImpersonation() {
      const urlParams = new URLSearchParams(window.location.search);
      const impersonation = urlParams.get(IMPERSONATION_URL_SEARCH_KEY);
      if (impersonation) {
        SessionStorage.set(SESSION_STORAGE_KEYS.IMPERSONATION_USER, true);
      }
    },
    submitLogin() {
      this.loginApi.hasErrored = false;
      this.loginApi.showLoading = true;

      const credentials = {
        email: this.email
          ? decodeURIComponent(this.email)
          : this.credentials.email,
        password: this.credentials.password,
        sso_auth_token: this.ssoAuthToken,
        ssoAccountId: this.ssoAccountId,
        ssoConversationId: this.ssoConversationId,
      };

      login(credentials)
        .then(result => {
          if (result?.mfaRequired) {
            this.loginApi.showLoading = false;
            this.mfaRequired = true;
            this.mfaToken = result.mfaToken;
            return;
          }

          this.handleImpersonation();
          this.showAlertMessage(this.$t('LOGIN.API.SUCCESS_MESSAGE'));
        })
        .catch(response => {
          if (this.email) {
            window.location = '/app/login';
          }
          this.loginApi.hasErrored = true;
          this.showAlertMessage(
            response?.message || this.$t('LOGIN.API.UNAUTH')
          );
        });
    },
    submitFormLogin() {
      if (this.v$.credentials.email.$invalid && !this.email) {
        this.showAlertMessage(this.$t('LOGIN.EMAIL.ERROR'));
        return;
      }

      this.submitLogin();
    },
    handleMfaVerified() {
      this.handleImpersonation();
      window.location = '/app';
    },
    handleMfaCancel() {
      this.mfaRequired = false;
      this.mfaToken = null;
      this.credentials.password = '';
    },
    changeLocale(localeCode) {
      this.selectedLocale = localeCode;
      this.$root.$i18n.locale = localeCode;
      this.showLanguageDropdown = false;
    },
    toggleLanguageDropdown() {
      this.showLanguageDropdown = !this.showLanguageDropdown;
    },
    handleClickOutside(event) {
      const dropdown = this.$refs.languageDropdown;
      if (dropdown && !dropdown.contains(event.target)) {
        this.showLanguageDropdown = false;
      }
    },
  },
};
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
        class="absolute -top-24 -right-24 w-96 h-96 bg-[#E91E8C]/20 rounded-full blur-3xl"
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
            {{ $t('LOGIN.HERO.TITLE') }}
          </h1>
          <p class="text-lg text-white/80 mb-10 max-w-md">
            {{ $t('LOGIN.HERO.DESCRIPTION') }}
          </p>

          <!-- Features List -->
          <div class="space-y-5">
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <Icon icon="i-lucide-inbox" class="size-5 text-white" />
              </div>
              <span class="text-white font-medium">
                {{ $t('LOGIN.HERO.FEATURE_1') }}
              </span>
            </div>
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <Icon icon="i-lucide-bot" class="size-5 text-white" />
              </div>
              <span class="text-white font-medium">
                {{ $t('LOGIN.HERO.FEATURE_2') }}
              </span>
            </div>
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <Icon icon="i-lucide-zap" class="size-5 text-white" />
              </div>
              <span class="text-white font-medium">
                {{ $t('LOGIN.HERO.FEATURE_3') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Testimonial -->
        <div
          class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <p class="text-white/90 italic mb-4 leading-relaxed">
            {{ $t('LOGIN.HERO.TESTIMONIAL_TEXT') }}
          </p>
          <div class="flex items-center gap-3">
            <div
              class="size-10 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            >
              {{ $t('LOGIN.HERO.TESTIMONIAL_INITIALS') }}
            </div>
            <div>
              <p class="text-white font-medium text-sm">
                {{ $t('LOGIN.HERO.TESTIMONIAL_NAME') }}
              </p>
              <p class="text-white/60 text-xs">
                {{ $t('LOGIN.HERO.TESTIMONIAL_ROLE') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Right Panel - Login Form -->
    <section
      class="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-n-background dark:bg-n-background relative"
    >
      <!-- Language Selector (Top Right) -->
      <div
        ref="languageDropdown"
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

      <!-- MFA Verification -->
      <div v-if="mfaRequired" class="w-full max-w-md">
        <MfaVerification
          :mfa-token="mfaToken"
          @verified="handleMfaVerified"
          @cancel="handleMfaCancel"
        />
      </div>

      <!-- Login Form Container -->
      <div
        v-else
        class="w-full max-w-md"
        :class="{ 'animate-wiggle': loginApi.hasErrored }"
      >
        <!-- Header -->
        <div class="text-center mb-8">
          <h2
            class="text-2xl sm:text-3xl font-bold tracking-tight text-n-slate-12 mb-2"
          >
            {{ replaceInstallationName($t('LOGIN.TITLE')) }}
          </h2>
          <p class="text-n-slate-11">
            {{ $t('LOGIN.SUBTITLE') }}
          </p>
        </div>

        <div v-if="!email">
          <!-- OAuth Buttons -->
          <div v-if="showGoogleOAuth || showSamlLogin" class="space-y-3 mb-6">
            <GoogleOAuthButton v-if="showGoogleOAuth" />
            <router-link
              v-if="showSamlLogin"
              to="/app/login/sso"
              class="flex justify-center w-full px-4 py-3.5 items-center bg-n-background dark:bg-n-solid-3 rounded-xl ring-1 ring-inset ring-n-weak hover:ring-n-slate-7 hover:bg-n-alpha-2 dark:hover:bg-n-alpha-2 transition-all duration-200"
            >
              <Icon
                icon="i-lucide-shield-check"
                class="size-5 text-n-slate-11"
              />
              <span class="ml-2.5 text-base font-medium text-n-slate-12">
                {{ $t('LOGIN.SAML.LABEL') }}
              </span>
            </router-link>

            <SimpleDivider
              :label="$t('COMMON.OR')"
              bg="bg-n-background dark:bg-n-background"
              class="uppercase"
            />
          </div>

          <!-- Email/Password Form -->
          <form class="space-y-5" @submit.prevent="submitFormLogin">
            <FormInput
              v-model="credentials.email"
              name="email_address"
              type="text"
              icon="mail"
              data-testid="email_input"
              :tabindex="1"
              required
              :label="$t('LOGIN.EMAIL.LABEL')"
              :placeholder="$t('LOGIN.EMAIL.PLACEHOLDER')"
              :has-error="v$.credentials.email.$error"
              @input="v$.credentials.email.$touch"
            />
            <FormInput
              v-model="credentials.password"
              type="password"
              name="password"
              icon="lock-closed"
              data-testid="password_input"
              required
              :tabindex="2"
              :label="$t('LOGIN.PASSWORD.LABEL')"
              :placeholder="$t('LOGIN.PASSWORD.PLACEHOLDER')"
              :has-error="v$.credentials.password.$error"
              @input="v$.credentials.password.$touch"
            >
              <p v-if="!globalConfig.disableUserProfileUpdate">
                <router-link
                  to="auth/reset/password"
                  class="text-sm text-n-brand hover:text-n-brand/80 font-medium transition-colors"
                  tabindex="4"
                >
                  {{ $t('LOGIN.FORGOT_PASSWORD') }}
                </router-link>
              </p>
            </FormInput>

            <NextButton
              lg
              type="submit"
              data-testid="submit_button"
              class="w-full"
              :tabindex="3"
              :label="$t('LOGIN.SUBMIT')"
              :disabled="loginApi.showLoading"
              :is-loading="loginApi.showLoading"
            />
          </form>

          <!-- Signup Link -->
          <p
            v-if="showSignupLink"
            class="mt-8 text-center text-sm text-n-slate-11"
          >
            {{ $t('LOGIN.NO_ACCOUNT') }}
            <router-link
              to="auth/signup"
              class="text-n-brand hover:text-n-brand/80 font-semibold transition-colors"
            >
              {{ $t('LOGIN.CREATE_NEW_ACCOUNT') }}
            </router-link>
          </p>
        </div>

        <!-- Loading State -->
        <div v-else class="flex items-center justify-center py-16">
          <Spinner color-scheme="primary" size="" />
        </div>
      </div>
    </section>
  </main>
</template>
