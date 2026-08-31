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
import OrbisShell from '../../components/Auth/OrbisShell.vue';
import OrbisPanel from '../../components/Auth/OrbisPanel.vue';

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
  <OrbisShell
    :hero-accent="globalConfig.installationName"
    :hero-title="t('LOGIN.SAML.HERO.TITLE')"
    :hero-description="t('LOGIN.SAML.HERO.DESCRIPTION')"
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

    <!-- Hero: feature list -->
    <template #hero-features>
      <div class="mt-12 space-y-4">
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon
              icon="i-lucide-key-round"
              class="size-[18px] text-orbis-neon"
            />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('LOGIN.SAML.HERO.FEATURE_1') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon
              icon="i-lucide-building-2"
              class="size-[18px] text-orbis-neon"
            />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('LOGIN.SAML.HERO.FEATURE_2') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon icon="i-lucide-lock" class="size-[18px] text-orbis-neon" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('LOGIN.SAML.HERO.FEATURE_3') }}
          </span>
        </div>
      </div>
    </template>

    <!-- Hero: security badge -->
    <template #hero-bottom>
      <OrbisPanel class="flex items-center gap-4 p-5">
        <div
          class="flex size-12 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
        >
          <Icon icon="i-lucide-badge-check" class="size-6 text-orbis-neon" />
        </div>
        <div>
          <p class="text-sm font-medium text-orbis-cream">
            {{ t('LOGIN.SAML.HERO.SECURITY_TITLE') }}
          </p>
          <p
            class="font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-cream/45"
          >
            {{ t('LOGIN.SAML.HERO.SECURITY_DESC') }}
          </p>
        </div>
      </OrbisPanel>
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

    <!-- SSO Form Container -->
    <OrbisPanel
      class="w-full max-w-md p-8 sm:p-10"
      :class="{ 'animate-wiggle': loginApi.hasErrored }"
    >
      <!-- Header -->
      <div class="mb-8">
        <div
          class="mb-5 inline-flex size-12 items-center justify-center rounded-xl border border-orbis-neon/25 bg-orbis-neon/10"
        >
          <Icon icon="i-lucide-shield-check" class="size-6 text-orbis-neon" />
        </div>
        <h2
          class="font-anton text-3xl uppercase leading-none tracking-[0.01em] text-orbis-cream sm:text-4xl"
        >
          {{ t('LOGIN.SAML.TITLE') }}
        </h2>
        <p
          class="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-orbis-cream/45"
        >
          {{ t('LOGIN.SAML.SUBTITLE') }}
        </p>
      </div>

      <!-- SSO Form -->
      <form
        class="space-y-5 [&_label]:font-mono [&_label]:text-[11px] [&_label]:uppercase [&_label]:tracking-[0.18em] [&_label]:text-orbis-cream/70 [&_label.text-n-ruby-11]:!text-orbis-danger [&_.pointer-events-none]:text-orbis-cream/35 [&_input]:rounded-xl [&_input]:bg-white/5 [&_input]:text-orbis-cream [&_input]:placeholder:text-orbis-cream/30 [&_input:not(.error)]:outline-white/15 [&_input:not(.error):hover]:outline-white/30 [&_input:not(.error):focus]:outline-orbis-neon [&_input:not(.error):focus]:ring-orbis-neon/15 [&_input.error]:outline-orbis-danger [&_input.error:hover]:outline-orbis-danger [&_input.error:focus]:outline-orbis-danger [&_input.error:focus]:ring-orbis-danger/15"
        method="POST"
        action="/api/v1/auth/saml_login"
      >
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
          class="w-full !rounded-xl bg-gradient-to-r from-[#b724ff] to-[#7c3aed] font-mono !text-sm uppercase tracking-[0.16em] !text-white transition-transform duration-200 hover:enabled:scale-[1.02]"
          :tabindex="2"
          :label="t('LOGIN.SAML.SUBMIT')"
          :disabled="loginApi.showLoading"
          :is-loading="loginApi.showLoading"
        />
      </form>

      <!-- Back to Login -->
      <p class="mt-8 text-center">
        <router-link
          to="/app/login"
          class="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-neon transition-colors hover:text-orbis-neon/70"
        >
          <Icon icon="i-lucide-arrow-left" class="size-4" />
          {{ t('LOGIN.SAML.BACK_TO_LOGIN') }}
        </router-link>
      </p>
    </OrbisPanel>
  </OrbisShell>
</template>
