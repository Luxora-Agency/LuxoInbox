<script>
export default {
  methods: {
    getGoogleAuthUrl() {
      // Ideally a request to /auth/google_oauth2 should be made
      // Creating the URL manually because the devise-token-auth with
      // omniauth has a standing issue on redirecting the post request
      // https://github.com/lynndylanhurley/devise_token_auth/issues/1466
      const baseUrl =
        'https://accounts.google.com/o/oauth2/auth/oauthchooseaccount';
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
      class="inline-flex justify-center w-full px-4 py-3.5 bg-n-background dark:bg-n-solid-3 items-center rounded-xl ring-1 ring-inset ring-n-weak dark:ring-n-weak hover:ring-n-slate-7 dark:hover:ring-n-slate-7 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-n-brand/20 focus:ring-offset-2 focus:ring-offset-n-background transition-all duration-200"
    >
      <span class="i-logos-google-icon h-5 w-5" />
      <span class="ml-2.5 text-base font-medium text-n-slate-12">
        <slot>{{ $t('LOGIN.OAUTH.GOOGLE_LOGIN') }}</slot>
      </span>
    </a>
  </div>
</template>
