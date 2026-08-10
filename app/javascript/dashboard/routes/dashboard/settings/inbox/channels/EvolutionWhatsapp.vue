<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useAlert } from 'dashboard/composables';
import evolutionChannel from 'dashboard/api/channel/evolutionChannel';
import NextButton from 'dashboard/components-next/button/Button.vue';
import Icon from 'next/icon/Icon.vue';

const { t } = useI18n();
const store = useStore();
const router = useRouter();
const route = useRoute();

// Steps
const STEPS = {
  CONFIG: 'config',
  QR_CODE: 'qr_code',
  CONNECTING: 'connecting',
  SUCCESS: 'success',
};

const currentStep = ref(STEPS.CONFIG);
const inboxName = ref('');
const instanceName = ref('');
const qrCodeBase64 = ref('');
const isLoading = ref(false);
const connectionStatus = ref('');
const pollingInterval = ref(null);
const qrRefreshInterval = ref(null);
const errorMessage = ref('');

// Evolution rotates the pairing QR roughly every minute; a stale one makes
// WhatsApp reject the scan with "couldn't link device".
const QR_REFRESH_INTERVAL = 20000;

const isConfigStep = computed(() => currentStep.value === STEPS.CONFIG);
const isQRCodeStep = computed(() => currentStep.value === STEPS.QR_CODE);
const isConnectingStep = computed(() => currentStep.value === STEPS.CONNECTING);
const isSuccessStep = computed(() => currentStep.value === STEPS.SUCCESS);

const generateInstanceName = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `luxoinbox_${timestamp}_${random}`;
};

const createChatwootInbox = async () => {
  try {
    isLoading.value = true;

    // Create the inbox in Chatwoot
    const whatsappChannel = await store.dispatch('inboxes/createChannel', {
      name: inboxName.value.trim(),
      channel: {
        type: 'api',
        webhook_url: `${window.location.origin}/webhooks/evolution/${route.params.accountId}`,
        additional_attributes: {
          evolution_instance: instanceName.value,
          provider: 'evolution',
        },
      },
    });

    currentStep.value = STEPS.SUCCESS;

    // Redirect to add agents
    setTimeout(() => {
      router.replace({
        name: 'settings_inboxes_add_agents',
        params: {
          page: 'new',
          inbox_id: whatsappChannel.id,
        },
      });
    }, 2000);
  } catch (error) {
    errorMessage.value =
      error.message ||
      t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.ERRORS.INBOX_CREATION_FAILED');
    useAlert(errorMessage.value);
    currentStep.value = STEPS.QR_CODE;
  } finally {
    isLoading.value = false;
  }
};

const stopTimers = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
  if (qrRefreshInterval.value) {
    clearInterval(qrRefreshInterval.value);
    qrRefreshInterval.value = null;
  }
};

const startPolling = () => {
  stopTimers();

  pollingInterval.value = setInterval(async () => {
    try {
      const { data } = await evolutionChannel.getConnectionStatus(
        instanceName.value
      );
      const state = data.instance?.state || data.state;
      connectionStatus.value = state;

      if (state === 'open') {
        stopTimers();
        currentStep.value = STEPS.CONNECTING;
        await createChatwootInbox();
      }
    } catch {
      // Silently handle polling errors
    }
  }, 3000);

  qrRefreshInterval.value = setInterval(async () => {
    try {
      const { data } = await evolutionChannel.getQRCode(instanceName.value);
      const qr = extractQRCode(data);
      if (qr) qrCodeBase64.value = qr;
    } catch {
      // Keep showing the previous code until the next refresh succeeds
    }
  }, QR_REFRESH_INTERVAL);
};

const extractQRCode = data => {
  // Handle different Evolution API response formats
  return data.qrcode?.base64 || data.base64 || data.qrcode?.pairingCode || null;
};

const refreshQRCode = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    const { data } = await evolutionChannel.getQRCode(instanceName.value);
    const qr = extractQRCode(data);
    if (qr) {
      qrCodeBase64.value = qr;
    }
  } catch {
    errorMessage.value = t(
      'INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.ERRORS.QR_REFRESH_FAILED'
    );
  } finally {
    isLoading.value = false;
  }
};

const showQRCode = (base64, startPoll = true) => {
  qrCodeBase64.value = base64;
  currentStep.value = STEPS.QR_CODE;
  if (startPoll) startPolling();
};

const createEvolutionInstance = async () => {
  if (!inboxName.value.trim()) {
    useAlert(t('INBOX_MGMT.ADD.WHATSAPP.INBOX_NAME.ERROR'));
    return;
  }

  try {
    isLoading.value = true;
    errorMessage.value = '';
    instanceName.value = generateInstanceName();

    const { data } = await evolutionChannel.createInstance(instanceName.value);

    const qr = extractQRCode(data);
    if (qr) {
      showQRCode(qr);
      return;
    }

    // Instance created but no QR in response, fetch it separately
    const { data: qrData } = await evolutionChannel.getQRCode(
      instanceName.value
    );
    const fallbackQR = extractQRCode(qrData);
    if (fallbackQR) {
      showQRCode(fallbackQR);
      return;
    }

    throw new Error('No QR code received from Evolution API');
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.ERRORS.INSTANCE_CREATION_FAILED');
    useAlert(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
};

const cancelSetup = async () => {
  stopTimers();

  if (instanceName.value) {
    try {
      await evolutionChannel.deleteInstance(instanceName.value);
    } catch {
      // Silently handle deletion errors
    }
  }

  router.push({
    name: route.name,
    params: route.params,
    query: {},
  });
};

onUnmounted(() => {
  stopTimers();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Step: Configuration -->
    <div v-if="isConfigStep" class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-lg font-medium text-n-slate-12">
          {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.TITLE') }}
        </h2>
        <p class="text-sm text-n-slate-11">
          {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.DESC') }}
        </p>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-n-slate-12">
            {{ $t('INBOX_MGMT.ADD.WHATSAPP.INBOX_NAME.LABEL') }}
          </label>
          <input
            v-model="inboxName"
            type="text"
            class="w-full px-3 py-2 text-sm border rounded-lg border-n-weak bg-n-alpha-1 text-n-slate-12 focus:outline-none focus:ring-2 focus:ring-n-brand"
            :placeholder="$t('INBOX_MGMT.ADD.WHATSAPP.INBOX_NAME.PLACEHOLDER')"
          />
        </div>

        <div
          class="flex items-start gap-3 p-4 rounded-lg bg-n-alpha-1 border border-n-weak"
        >
          <Icon icon="i-lucide-info" class="size-5 text-n-blue-text shrink-0" />
          <div class="flex flex-col gap-1">
            <p class="text-sm font-medium text-n-slate-12">
              {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.INFO.TITLE') }}
            </p>
            <ul class="text-sm text-n-slate-11 list-disc list-inside space-y-1">
              <li>
                {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.INFO.STEP_1') }}
              </li>
              <li>
                {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.INFO.STEP_2') }}
              </li>
              <li>
                {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.INFO.STEP_3') }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <NextButton
          :is-loading="isLoading"
          :label="$t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.GENERATE_QR')"
          solid
          blue
          @click="createEvolutionInstance"
        />
        <NextButton
          :label="$t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.CANCEL')"
          faded
          slate
          @click="cancelSetup"
        />
      </div>
    </div>

    <!-- Step: QR Code -->
    <div v-if="isQRCodeStep" class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-lg font-medium text-n-slate-12">
          {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.QR_TITLE') }}
        </h2>
        <p class="text-sm text-n-slate-11">
          {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.QR_DESC') }}
        </p>
      </div>

      <div class="flex flex-col items-center gap-4">
        <div class="p-4 bg-white rounded-2xl shadow-lg border border-n-weak">
          <img
            v-if="qrCodeBase64"
            :src="qrCodeBase64"
            alt="WhatsApp QR Code"
            class="w-64 h-64"
          />
          <div
            v-else
            class="w-64 h-64 flex items-center justify-center bg-n-alpha-1 rounded-lg"
          >
            <Icon
              icon="i-lucide-loader-2"
              class="size-8 text-n-slate-9 animate-spin"
            />
          </div>
        </div>

        <div class="flex flex-col items-center gap-2">
          <div class="flex items-center gap-2 text-n-slate-11">
            <Icon icon="i-lucide-loader-2" class="size-4 animate-spin" />
            <span class="text-sm">
              {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.WAITING_SCAN') }}
            </span>
          </div>
          <button
            class="text-sm text-n-brand hover:underline"
            @click="refreshQRCode"
          >
            {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.REFRESH_QR') }}
          </button>
        </div>
      </div>

      <div class="flex justify-center">
        <NextButton
          :label="$t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.CANCEL')"
          faded
          slate
          @click="cancelSetup"
        />
      </div>
    </div>

    <!-- Step: Connecting -->
    <div v-if="isConnectingStep" class="flex flex-col items-center gap-6 py-8">
      <div
        class="flex items-center justify-center w-16 h-16 rounded-full bg-n-teal-3"
      >
        <Icon
          icon="i-lucide-loader-2"
          class="size-8 text-n-teal-11 animate-spin"
        />
      </div>
      <div class="flex flex-col items-center gap-2">
        <h2 class="text-lg font-medium text-n-slate-12">
          {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.CONNECTING_TITLE') }}
        </h2>
        <p class="text-sm text-n-slate-11">
          {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.CONNECTING_DESC') }}
        </p>
      </div>
    </div>

    <!-- Step: Success -->
    <div v-if="isSuccessStep" class="flex flex-col items-center gap-6 py-8">
      <div
        class="flex items-center justify-center w-16 h-16 rounded-full bg-n-teal-3"
      >
        <Icon icon="i-lucide-check" class="size-8 text-n-teal-11" />
      </div>
      <div class="flex flex-col items-center gap-2">
        <h2 class="text-lg font-medium text-n-slate-12">
          {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.SUCCESS_TITLE') }}
        </h2>
        <p class="text-sm text-n-slate-11">
          {{ $t('INBOX_MGMT.ADD.WHATSAPP.EVOLUTION.SUCCESS_DESC') }}
        </p>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="flex items-start gap-3 p-4 rounded-lg bg-n-ruby-3 border border-n-ruby-6"
    >
      <Icon
        icon="i-lucide-alert-circle"
        class="size-5 text-n-ruby-11 shrink-0"
      />
      <p class="text-sm text-n-ruby-11">{{ errorMessage }}</p>
    </div>
  </div>
</template>
