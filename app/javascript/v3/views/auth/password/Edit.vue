<script setup>
import { ref, computed, onMounted } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, minLength } from '@vuelidate/validators';
import { useAlert } from 'dashboard/composables';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import FormInput from '../../../components/Form/Input.vue';
import NextButton from 'dashboard/components-next/button/Button.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import OrbisShell from '../../../components/Auth/OrbisShell.vue';
import OrbisPanel from '../../../components/Auth/OrbisPanel.vue';
import { DEFAULT_REDIRECT_URL } from 'dashboard/constants/globals';
import { setNewPassword } from '../../../api/auth';

const props = defineProps({
  resetPasswordToken: { type: String, default: '' },
});

const store = useStore();
const { t } = useI18n();

const credentials = ref({
  confirmPassword: '',
  password: '',
});

const newPasswordAPI = ref({
  message: '',
  showLoading: false,
});

const rules = {
  credentials: {
    password: {
      required,
      minLength: minLength(6),
    },
    confirmPassword: {
      required,
      minLength: minLength(6),
      isEqPassword: value => value === credentials.value.password,
    },
  },
};

const v$ = useVuelidate(rules, { credentials });
const globalConfig = computed(() => store.getters['globalConfig/get']);

onMounted(() => {
  if (!props.resetPasswordToken) {
    window.location = DEFAULT_REDIRECT_URL;
  }
});

const showAlertMessage = message => {
  newPasswordAPI.value.showLoading = false;
  useAlert(message);
};

const submitForm = () => {
  newPasswordAPI.value.showLoading = true;
  const data = {
    confirmPassword: credentials.value.confirmPassword,
    password: credentials.value.password,
    resetPasswordToken: props.resetPasswordToken,
  };
  setNewPassword(data)
    .then(() => {
      window.location = DEFAULT_REDIRECT_URL;
    })
    .catch(error => {
      showAlertMessage(
        error?.message || t('SET_NEW_PASSWORD.API.ERROR_MESSAGE')
      );
    });
};
</script>

<template>
  <OrbisShell
    :hero-accent="globalConfig.installationName"
    :hero-title="t('SET_NEW_PASSWORD.HERO.TITLE')"
    :hero-description="t('SET_NEW_PASSWORD.HERO.DESCRIPTION')"
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

    <!-- Hero: tips -->
    <template #hero-features>
      <div class="mt-12 space-y-4">
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon
              icon="i-lucide-shield-check"
              class="size-[18px] text-orbis-neon"
            />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('SET_NEW_PASSWORD.HERO.TIP_1') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon icon="i-lucide-hash" class="size-[18px] text-orbis-neon" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('SET_NEW_PASSWORD.HERO.TIP_2') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon icon="i-lucide-eye-off" class="size-[18px] text-orbis-neon" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('SET_NEW_PASSWORD.HERO.TIP_3') }}
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
          <Icon icon="i-lucide-lock" class="size-6 text-orbis-neon" />
        </div>
        <div>
          <p class="text-sm font-medium text-orbis-cream">
            {{ t('SET_NEW_PASSWORD.HERO.SECURITY_TITLE') }}
          </p>
          <p
            class="font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-cream/45"
          >
            {{ t('SET_NEW_PASSWORD.HERO.SECURITY_DESC') }}
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

    <!-- New Password Form Container -->
    <OrbisPanel class="w-full max-w-md p-8 sm:p-10">
      <!-- Header -->
      <div class="mb-8">
        <div
          class="mb-5 inline-flex size-12 items-center justify-center rounded-xl border border-orbis-neon/25 bg-orbis-neon/10"
        >
          <Icon icon="i-lucide-key-round" class="size-6 text-orbis-neon" />
        </div>
        <h2
          class="font-anton text-3xl uppercase leading-none tracking-[0.01em] text-orbis-cream sm:text-4xl"
        >
          {{ t('SET_NEW_PASSWORD.TITLE') }}
        </h2>
        <p
          class="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-orbis-cream/45"
        >
          {{ t('SET_NEW_PASSWORD.SUBTITLE') }}
        </p>
      </div>

      <!-- New Password Form -->
      <form
        class="space-y-5 [&_label]:font-mono [&_label]:text-[11px] [&_label]:uppercase [&_label]:tracking-[0.18em] [&_label]:text-orbis-cream/70 [&_label.text-n-ruby-11]:!text-orbis-danger [&_.pointer-events-none]:text-orbis-cream/35 [&_input]:rounded-xl [&_input]:bg-white/5 [&_input]:text-orbis-cream [&_input]:placeholder:text-orbis-cream/30 [&_input:not(.error)]:outline-white/15 [&_input:not(.error):hover]:outline-white/30 [&_input:not(.error):focus]:outline-orbis-neon [&_input:not(.error):focus]:ring-orbis-neon/15 [&_input.error]:outline-orbis-danger [&_input.error:hover]:outline-orbis-danger [&_input.error:focus]:outline-orbis-danger [&_input.error:focus]:ring-orbis-danger/15 [&_button[aria-pressed]]:text-orbis-cream/45 [&_button[aria-pressed]:hover]:text-orbis-cream"
        @submit.prevent="submitForm"
      >
        <FormInput
          v-model="credentials.password"
          name="password"
          type="password"
          icon="lock-closed"
          :label="t('SET_NEW_PASSWORD.PASSWORD.LABEL')"
          :has-error="v$.credentials.password.$error"
          :error-message="t('SET_NEW_PASSWORD.PASSWORD.ERROR')"
          :placeholder="t('SET_NEW_PASSWORD.PASSWORD.PLACEHOLDER')"
          @blur="v$.credentials.password.$touch"
        />
        <FormInput
          v-model="credentials.confirmPassword"
          name="confirm_password"
          type="password"
          icon="lock-closed"
          :label="t('SET_NEW_PASSWORD.CONFIRM_PASSWORD.LABEL')"
          :has-error="v$.credentials.confirmPassword.$error"
          :error-message="t('SET_NEW_PASSWORD.CONFIRM_PASSWORD.ERROR')"
          :placeholder="t('SET_NEW_PASSWORD.CONFIRM_PASSWORD.PLACEHOLDER')"
          @blur="v$.credentials.confirmPassword.$touch"
        />
        <NextButton
          lg
          type="submit"
          data-testid="submit_button"
          class="w-full !rounded-xl bg-gradient-to-r from-[#b724ff] to-[#7c3aed] font-mono !text-sm uppercase tracking-[0.16em] !text-white transition-transform duration-200 hover:enabled:scale-[1.02]"
          :label="t('SET_NEW_PASSWORD.SUBMIT')"
          :disabled="
            v$.credentials.password.$invalid ||
            v$.credentials.confirmPassword.$invalid ||
            newPasswordAPI.showLoading
          "
          :is-loading="newPasswordAPI.showLoading"
        />
      </form>

      <!-- Back to Login -->
      <p class="mt-8 text-center">
        <router-link
          to="/app/login"
          class="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-neon transition-colors hover:text-orbis-neon/70"
        >
          <Icon icon="i-lucide-arrow-left" class="size-4" />
          {{ t('SET_NEW_PASSWORD.BACK_TO_LOGIN') }}
        </router-link>
      </p>
    </OrbisPanel>
  </OrbisShell>
</template>
