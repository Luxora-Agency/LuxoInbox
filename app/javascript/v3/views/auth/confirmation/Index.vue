<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { DEFAULT_REDIRECT_URL } from 'dashboard/constants/globals';
import { verifyPasswordToken } from '../../../api/auth';
import Spinner from 'shared/components/Spinner.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';
import OrbisShell from '../../../components/Auth/OrbisShell.vue';
import OrbisPanel from '../../../components/Auth/OrbisPanel.vue';

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
  <OrbisShell
    :hero-accent="globalConfig.installationName"
    :hero-title="t('CONFIRM_EMAIL_PAGE.HERO.TITLE')"
    :hero-description="t('CONFIRM_EMAIL_PAGE.HERO.DESCRIPTION')"
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

    <!-- Hero: steps -->
    <template #hero-features>
      <div class="mt-12 space-y-4">
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon icon="i-lucide-check" class="size-[18px] text-orbis-neon" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('CONFIRM_EMAIL_PAGE.HERO.STEP_1') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <Icon icon="i-lucide-check" class="size-[18px] text-orbis-neon" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('CONFIRM_EMAIL_PAGE.HERO.STEP_2') }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="flex size-10 flex-none animate-pulse items-center justify-center rounded-xl border border-orbis-neon/30 bg-orbis-neon/10"
          >
            <Icon
              icon="i-lucide-loader-2"
              class="size-[18px] animate-spin text-orbis-neon"
            />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream/80"
          >
            {{ t('CONFIRM_EMAIL_PAGE.HERO.STEP_3') }}
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
          <Icon icon="i-lucide-shield-check" class="size-6 text-orbis-neon" />
        </div>
        <div>
          <p class="text-sm font-medium text-orbis-cream">
            {{ t('CONFIRM_EMAIL_PAGE.HERO.SECURITY_TITLE') }}
          </p>
          <p
            class="font-mono text-[11px] uppercase tracking-[0.14em] text-orbis-cream/45"
          >
            {{ t('CONFIRM_EMAIL_PAGE.HERO.SECURITY_DESC') }}
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

    <!-- Confirmation Container -->
    <OrbisPanel class="w-full max-w-md p-8 text-center sm:p-10">
      <div
        class="mb-6 inline-flex size-12 items-center justify-center rounded-xl border border-orbis-neon/25 bg-orbis-neon/10"
      >
        <Icon icon="i-lucide-mail-check" class="size-6 text-orbis-neon" />
      </div>
      <h2
        class="font-anton text-3xl uppercase leading-none tracking-[0.01em] text-orbis-cream sm:text-4xl"
      >
        {{ t('CONFIRM_EMAIL_PAGE.TITLE') }}
      </h2>
      <p
        class="mt-3 mb-8 font-mono text-xs uppercase tracking-[0.16em] text-orbis-cream/45"
      >
        {{ t('CONFIRM_EMAIL_PAGE.DESCRIPTION') }}
      </p>
      <Spinner color-scheme="primary" size="" />
    </OrbisPanel>
  </OrbisShell>
</template>
