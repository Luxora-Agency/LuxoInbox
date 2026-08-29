<script>
export default {
  methods: {
    getGoogleAuthUrl() {
      // Ideally a request to /auth/google_oauth2 should be made
      // Creating the URL manually because the devise-token-auth with
      // omniauth has a standing issue on redirecting the post request
      // https://github.com/lynndylanhurley/devise_token_auth/issues/1466
      const baseUrl = 'https://accounts.google.com/o/oauth2/auth';
      const clientId = window.chatwootConfig.googleOAuthClientId;
      const redirectUri = window.chatwootConfig.googleOAuthCallbackUrl;
      const responseType = 'code';
      const scope = 'email profile';

      // Build the query string
      const queryString = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: responseType,
        scope: scope,
      }).toString();

      // Construct the full URL
      return `${baseUrl}?${queryString}`;
    },
  },
};
</script>

<!-- eslint-disable vue/no-unused-refs -->
<!-- Added ref for writing specs -->
<template>
  <div class="flex flex-col">
    <a
      :href="getGoogleAuthUrl()"
      class="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-[4px] transition-colors duration-200 hover:border-white/25 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-orbis-neon/30"
    >
      <span class="i-logos-google-icon h-5 w-5" />
      <span
        class="ml-2.5 font-mono text-xs uppercase tracking-[0.14em] text-orbis-cream"
      >
        <slot>{{ $t('LOGIN.OAUTH.GOOGLE_LOGIN') }}</slot>
      </span>
    </a>
  </div>
</template>
