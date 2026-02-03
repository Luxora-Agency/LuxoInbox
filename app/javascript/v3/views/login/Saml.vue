<script setup>
import { ref, nextTick, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { required, email } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import { useI18n } from 'vue-i18n';
import { useAlert } from 'dashboard/composables';

// components
import FormInput from '../../components/Form/Input.vue';
import NextButton from 'dashboard/components-next/button/Button.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';

const props = defineProps({
  authError: {
    type: String,
    default: '',
  },
  target: {
    type: String,
    default: 'web',
  },
});

const store = useStore();
const { t } = useI18n();

const credentials = ref({
  email: '',
});

const loginApi = ref({
  showLoading: false,
  hasErrored: false,
});

const handleAuthError = () => {
  if (!props.authError) {
    return;
  }

  const translatedMessage = t('LOGIN.SAML.API.ERROR_MESSAGE');
  useAlert(translatedMessage);
  loginApi.value.hasErrored = true;
};

const validations = {
  credentials: {
    email: {
      required,
      email,
    },
  },
};

const v$ = useVuelidate(validations, { credentials });

const globalConfig = computed(() => store.getters['globalConfig/get']);
const csrfToken = ref('');

onMounted(async () => {
  csrfToken.value =
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute('content') || '';

  await nextTick(handleAuthError);
});
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
            <Icon icon="i-lucide-shield-check" class="size-8 text-white" />
          </div>
          <h1
            class="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4"
          >
            {{ t('LOGIN.SAML.HERO.TITLE') }}
          </h1>
          <p class="text-lg text-white/80 mb-10 max-w-md">
            {{ t('LOGIN.SAML.HERO.DESCRIPTION') }}
          </p>

          <!-- Features List -->
          <div class="space-y-5">
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <Icon icon="i-lucide-key-round" class="size-5 text-white" />
              </div>
              <span class="text-white font-medium">
                {{ t('LOGIN.SAML.HERO.FEATURE_1') }}
              </span>
            </div>
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <Icon icon="i-lucide-building-2" class="size-5 text-white" />
              </div>
              <span class="text-white font-medium">
                {{ t('LOGIN.SAML.HERO.FEATURE_2') }}
              </span>
            </div>
            <div class="flex items-center gap-4">
              <div
                class="flex items-center justify-center size-10 bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <Icon icon="i-lucide-lock" class="size-5 text-white" />
              </div>
              <span class="text-white font-medium">
                {{ t('LOGIN.SAML.HERO.FEATURE_3') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Security Badge -->
        <div
          class="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 flex items-center gap-4"
        >
          <div
            class="size-12 bg-white/20 rounded-xl flex items-center justify-center"
          >
            <Icon icon="i-lucide-badge-check" class="size-6 text-white" />
          </div>
          <div>
            <p class="text-white font-medium text-sm">
              {{ t('LOGIN.SAML.HERO.SECURITY_TITLE') }}
            </p>
            <p class="text-white/60 text-xs">
              {{ t('LOGIN.SAML.HERO.SECURITY_DESC') }}
            </p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Right Panel - SSO Form -->
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

      <!-- SSO Form Container -->
      <div
        class="w-full max-w-md"
        :class="{ 'animate-wiggle': loginApi.hasErrored }"
      >
        <!-- Header -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center size-14 bg-n-brand/10 dark:bg-n-brand/20 rounded-2xl mb-4"
          >
            <Icon icon="i-lucide-shield-check" class="size-7 text-n-brand" />
          </div>
          <h2
            class="text-2xl sm:text-3xl font-bold tracking-tight text-n-slate-12 mb-2"
          >
            {{ t('LOGIN.SAML.TITLE') }}
          </h2>
          <p class="text-n-slate-11">
            {{ t('LOGIN.SAML.SUBTITLE') }}
          </p>
        </div>

        <!-- SSO Form -->
        <form class="space-y-5" method="POST" action="/api/v1/auth/saml_login">
          <FormInput
            v-model="credentials.email"
            name="email"
            type="text"
            icon="mail"
            :tabindex="1"
            required
            :label="t('LOGIN.SAML.WORK_EMAIL.LABEL')"
            :placeholder="t('LOGIN.SAML.WORK_EMAIL.PLACEHOLDER')"
            :has-error="v$.credentials.email.$error"
            @input="v$.credentials.email.$touch"
          />
          <input
            type="hidden"
            class="h-0"
            name="authenticity_token"
            :value="csrfToken"
          />
          <input type="hidden" class="h-0" name="target" :value="target" />
          <NextButton
            lg
            type="submit"
            class="w-full"
            :tabindex="2"
            :label="t('LOGIN.SAML.SUBMIT')"
            :disabled="loginApi.showLoading"
            :is-loading="loginApi.showLoading"
          />
        </form>

        <!-- Back to Login -->
        <p class="mt-8 text-center text-sm text-n-slate-11">
          <router-link
            to="/app/login"
            class="text-n-brand hover:text-n-brand/80 font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            <Icon icon="i-lucide-arrow-left" class="size-4" />
            {{ t('LOGIN.SAML.BACK_TO_LOGIN') }}
          </router-link>
        </p>
      </div>
    </section>
  </main>
</template>
