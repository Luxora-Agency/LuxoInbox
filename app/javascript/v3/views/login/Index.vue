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
import AnalyticsHelper from 'dashboard/helper/AnalyticsHelper';
import { SESSION_EVENTS } from 'dashboard/helper/AnalyticsHelper/events';

// components
import SimpleDivider from '../../components/Divider/SimpleDivider.vue';
import FormInput from '../../components/Form/Input.vue';
import GoogleOAuthButton from '../../components/GoogleOauth/Button.vue';
import Spinner from 'shared/components/Spinner.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import NextButton from 'dashboard/components-next/button/Button.vue';
import MfaVerification from 'dashboard/components/auth/MfaVerification.vue';
import SessionLimitOverlay from 'dashboard/components/auth/SessionLimitOverlay.vue';
import OrbisShell from '../../components/Auth/OrbisShell.vue';
import OrbisPanel from '../../components/Auth/OrbisPanel.vue';

const ERROR_MESSAGES = {
  'no-account-found': 'LOGIN.OAUTH.NO_ACCOUNT_FOUND',
  'business-account-only': 'LOGIN.OAUTH.BUSINESS_ACCOUNTS_ONLY',
  'saml-authentication-failed': 'LOGIN.SAML.API.ERROR_MESSAGE',
  'saml-not-enabled': 'LOGIN.SAML.API.ERROR_MESSAGE',
};

const IMPERSONATION_URL_SEARCH_KEY = 'impersonation';
const USER_NOT_CONFIRMED_ERROR_CODE = 'user_not_confirmed';

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
    SessionLimitOverlay,
    Icon,
    OrbisShell,
    OrbisPanel,
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
      sessionsLimitReached: false,
      limitedSessions: [],
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

          // Check if sessions limit reached
          if (result?.sessionsLimitReached) {
            this.loginApi.showLoading = false;
            this.sessionsLimitReached = true;
            this.limitedSessions = result.sessions;
            AnalyticsHelper.track(SESSION_EVENTS.LIMIT_HIT);
            return;
          }

          this.handleImpersonation();
          this.showAlertMessage(this.$t('LOGIN.API.SUCCESS_MESSAGE'));
        })
        .catch(response => {
          if (response?.errorCode === USER_NOT_CONFIRMED_ERROR_CODE) {
            this.loginApi.showLoading = false;
            this.$router.push({
              name: 'auth_verify_email',
              state: { email: credentials.email },
            });
            return;
          }

          // Reset URL Params if the authentication is invalid
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
    retryLoginWithParams(extraParams) {
      const credentials = {
        email: this.email
          ? decodeURIComponent(this.email)
          : this.credentials.email,
        password: this.credentials.password,
        sso_auth_token: this.ssoAuthToken,
        ssoAccountId: this.ssoAccountId,
        ssoConversationId: this.ssoConversationId,
        ...extraParams,
      };

      this.sessionsLimitReached = false;
      this.limitedSessions = [];
      this.loginApi.showLoading = true;
      login(credentials)
        .then(result => {
          if (result?.sessionsLimitReached) {
            this.loginApi.showLoading = false;
            this.sessionsLimitReached = true;
            this.limitedSessions = result.sessions;
            AnalyticsHelper.track(SESSION_EVENTS.LIMIT_HIT);
            return;
          }
          this.handleImpersonation();
          this.showAlertMessage(this.$t('LOGIN.API.SUCCESS_MESSAGE'));
        })
        .catch(response => {
          this.loginApi.hasErrored = true;
          this.showAlertMessage(
            response?.message || this.$t('LOGIN.API.UNAUTH')
          );
        });
    },
    handleSessionRevoke(sessionId) {
      this.retryLoginWithParams({ revoke_session_id: sessionId });
    },
    handleSessionRevokeAll() {
      this.retryLoginWithParams({ revoke_all_sessions: true });
    },
    handleSessionLimitCancel() {
      this.sessionsLimitReached = false;
      this.limitedSessions = [];
      this.credentials.password = '';
    },
  },
};
</script>

<template>
  <OrbisShell
    :hero-accent="globalConfig.installationName"
    :hero-title="$t('LOGIN.HERO.TITLE')"
    :hero-description="$t('LOGIN.HERO.DESCRIPTION')"
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
            <Icon icon="i-lucide-inbox" class="size-[18px] text-orbis-neon" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ $t('LOGIN.HERO.FEATURE_1') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon icon="i-lucide-bot" class="size-[18px] text-orbis-neon" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ $t('LOGIN.HERO.FEATURE_2') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon icon="i-lucide-zap" class="size-[18px] text-orbis-neon" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ $t('LOGIN.HERO.FEATURE_3') }}
          </span>
        </div>
      </div>
    </template>

    <!-- Hero: testimonial -->
    <template #hero-bottom>
      <OrbisPanel class="p-6">
        <p class="font-mono text-sm leading-relaxed text-orbis-cream/80">
          {{ $t('LOGIN.HERO.TESTIMONIAL_TEXT') }}
        </p>
        <div class="mt-5 flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-full border border-orbis-neon/30 bg-orbis-neon/10 font-mono text-xs font-semibold text-orbis-neon"
          >
            {{ $t('LOGIN.HERO.TESTIMONIAL_INITIALS') }}
          </div>
          <div>
            <p class="text-sm font-medium text-orbis-cream">
              {{ $t('LOGIN.HERO.TESTIMONIAL_NAME') }}
            </p>
            <p
              class="font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-cream/45"
            >
              {{ $t('LOGIN.HERO.TESTIMONIAL_ROLE') }}
            </p>
          </div>
        </div>
      </OrbisPanel>
    </template>

    <!-- Language Selector (Top Right) -->
    <template #top-right>
      <div
        ref="languageDropdown"
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

    <!-- Session Limit -->
    <div v-if="sessionsLimitReached" class="w-full max-w-md">
      <SessionLimitOverlay
        :sessions="limitedSessions"
        @revoke="handleSessionRevoke"
        @revoke-all="handleSessionRevokeAll"
        @cancel="handleSessionLimitCancel"
      />
    </div>

    <!-- MFA Verification -->
    <div v-else-if="mfaRequired" class="w-full max-w-md">
      <MfaVerification
        :mfa-token="mfaToken"
        @verified="handleMfaVerified"
        @cancel="handleMfaCancel"
      />
    </div>

    <!-- Login Form Container -->
    <OrbisPanel
      v-else
      class="w-full max-w-md p-8 sm:p-10"
      :class="{ 'animate-wiggle': loginApi.hasErrored }"
    >
      <!-- Header -->
      <div class="mb-8">
        <h2
          class="font-anton text-3xl uppercase leading-none tracking-[0.01em] text-orbis-cream sm:text-4xl"
        >
          {{ replaceInstallationName($t('LOGIN.TITLE')) }}
        </h2>
        <p
          class="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-orbis-cream/45"
        >
          {{ $t('LOGIN.SUBTITLE') }}
        </p>
      </div>

      <div v-if="!email">
        <!-- OAuth Buttons -->
        <div v-if="showGoogleOAuth || showSamlLogin" class="mb-6 space-y-3">
          <GoogleOAuthButton v-if="showGoogleOAuth" />
          <router-link
            v-if="showSamlLogin"
            to="/app/login/sso"
            class="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 transition-colors duration-200 hover:border-white/25 hover:bg-white/10"
          >
            <Icon
              icon="i-lucide-shield-check"
              class="size-5 text-orbis-cream/60"
            />
            <span
              class="ml-2.5 font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream"
            >
              {{ $t('LOGIN.SAML.LABEL') }}
            </span>
          </router-link>

          <SimpleDivider
            :label="$t('COMMON.OR')"
            bg="bg-orbis-navy"
            class="uppercase [&_span]:font-mono [&_span]:text-[11px] [&_span]:tracking-[0.2em] [&_span]:text-orbis-cream/40"
          />
        </div>

        <!-- Email/Password Form -->
        <form
          class="space-y-5 [&_label]:font-mono [&_label]:text-[11px] [&_label]:uppercase [&_label]:tracking-[0.18em] [&_label]:text-orbis-cream/70 [&_label.text-n-ruby-11]:!text-orbis-danger [&_.pointer-events-none]:text-orbis-cream/35 [&_input]:rounded-xl [&_input]:bg-white/5 [&_input]:text-orbis-cream [&_input]:placeholder:text-orbis-cream/30 [&_input:not(.error)]:outline-white/15 [&_input:not(.error):hover]:outline-white/30 [&_input:not(.error):focus]:outline-orbis-neon [&_input:not(.error):focus]:ring-orbis-neon/15 [&_input.error]:outline-orbis-danger [&_input.error:hover]:outline-orbis-danger [&_input.error:focus]:outline-orbis-danger [&_input.error:focus]:ring-orbis-danger/15 [&_button[aria-pressed]]:text-orbis-cream/45 [&_button[aria-pressed]:hover]:text-orbis-cream"
          @submit.prevent="submitFormLogin"
        >
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
                class="font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-neon transition-colors hover:text-orbis-neon/70"
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
            class="w-full !rounded-xl bg-gradient-to-r from-[#b724ff] to-[#7c3aed] font-mono !text-sm uppercase tracking-[0.16em] !text-white transition-transform duration-200 hover:enabled:scale-[1.02]"
            :tabindex="3"
            :label="$t('LOGIN.SUBMIT')"
            :disabled="loginApi.showLoading"
            :is-loading="loginApi.showLoading"
          />
        </form>

        <!-- Signup Link -->
        <p
          v-if="showSignupLink"
          class="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-cream/45"
        >
          {{ $t('LOGIN.NO_ACCOUNT') }}
          <router-link
            to="auth/signup"
            class="text-orbis-neon transition-colors hover:text-orbis-neon/70"
          >
            {{ $t('LOGIN.CREATE_NEW_ACCOUNT') }}
          </router-link>
        </p>
      </div>

      <!-- Loading State -->
      <div v-else class="flex items-center justify-center py-16">
        <Spinner color-scheme="primary" size="" />
      </div>
    </OrbisPanel>
  </OrbisShell>
</template>
