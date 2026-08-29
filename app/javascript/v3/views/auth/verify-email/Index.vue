<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useAlert } from 'dashboard/composables';
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha';
import NextButton from 'dashboard/components-next/button/Button.vue';
import OrbisPanel from '../../../components/Auth/OrbisPanel.vue';
import { resendConfirmation } from '../../../api/auth';

const props = defineProps({
  email: {
    type: String,
    default: '',
  },
});

const { t } = useI18n();
const router = useRouter();
const store = useStore();

if (!props.email) {
  router.push({ name: 'login' });
}

const globalConfig = computed(() => store.getters['globalConfig/get']);
const isResendingEmail = ref(false);
const hCaptcha = ref(null);
let captchaToken = '';

const performResend = async () => {
  isResendingEmail.value = true;
  try {
    await resendConfirmation({
      email: props.email,
      hCaptchaClientResponse: captchaToken,
    });
    useAlert(t('REGISTER.VERIFY_EMAIL.RESEND_SUCCESS'));
  } catch {
    useAlert(t('REGISTER.VERIFY_EMAIL.RESEND_ERROR'));
  } finally {
    isResendingEmail.value = false;
    captchaToken = '';
    if (globalConfig.value.hCaptchaSiteKey) {
      hCaptcha.value.reset();
    }
  }
};

const handleResendEmail = () => {
  if (isResendingEmail.value) return;
  if (globalConfig.value.hCaptchaSiteKey) {
    hCaptcha.value.execute();
  } else {
    performResend();
  }
};

const onCaptchaVerified = token => {
  captchaToken = token;
  performResend();
};

const onCaptchaError = () => {
  isResendingEmail.value = false;
  captchaToken = '';
  hCaptcha.value.reset();
};
</script>

<template>
  <main
    class="relative flex flex-col w-full min-h-screen py-20 bg-orbis-navy text-orbis-cream antialiased sm:px-6 lg:px-8"
  >
    <div
      class="pointer-events-none absolute inset-0 z-0 opacity-[0.05] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22140%22%20height%3D%22140%22%3E%3Cfilter%20id%3D%22g%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.85%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22140%22%20height%3D%22140%22%20filter%3D%22url(%23g)%22%2F%3E%3C%2Fsvg%3E')]"
    />
    <OrbisPanel
      class="relative z-10 sm:mx-auto mt-11 sm:w-full sm:max-w-lg p-8 sm:p-11"
    >
      <div class="mb-6">
        <h2
          class="font-anton text-3xl uppercase leading-none tracking-[0.01em] text-orbis-cream"
        >
          {{ $t('REGISTER.VERIFY_EMAIL.TITLE') }}
        </h2>
        <p class="mt-3 font-mono text-xs leading-relaxed text-orbis-cream/45">
          {{ $t('REGISTER.VERIFY_EMAIL.DESCRIPTION', { email }) }}
        </p>
      </div>
      <div class="space-y-4">
        <VueHcaptcha
          v-if="globalConfig.hCaptchaSiteKey"
          ref="hCaptcha"
          size="invisible"
          :sitekey="globalConfig.hCaptchaSiteKey"
          @verify="onCaptchaVerified"
          @error="onCaptchaError"
          @expired="onCaptchaError"
          @challenge-expired="onCaptchaError"
          @closed="onCaptchaError"
        />
        <NextButton
          lg
          type="button"
          data-testid="resend_email_button"
          class="w-full !rounded-xl bg-gradient-to-r from-[#b724ff] to-[#7c3aed] font-mono !text-sm uppercase tracking-[0.16em] !text-white transition-transform duration-200 hover:enabled:scale-[1.02]"
          :label="$t('REGISTER.VERIFY_EMAIL.RESEND')"
          :is-loading="isResendingEmail"
          @click="handleResendEmail"
        />
      </div>
    </OrbisPanel>
  </main>
</template>
