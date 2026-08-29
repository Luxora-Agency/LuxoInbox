<script setup>
// Presentational only: the two-panel Orbis auth layout.
// No state, no watchers, no listeners — every `v-if`, handler, ref and
// validation stays in the page that uses this shell.
defineProps({
  heroAccent: { type: String, default: '' },
  heroTitle: { type: String, default: '' },
  heroDescription: { type: String, default: '' },
});

const HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4';
</script>

<template>
  <main
    class="relative flex min-h-screen w-full bg-orbis-navy text-orbis-cream antialiased"
  >
    <!-- Grain -->
    <div
      class="pointer-events-none absolute inset-0 z-0 opacity-[0.05] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22140%22%20height%3D%22140%22%3E%3Cfilter%20id%3D%22g%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.85%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22140%22%20height%3D%22140%22%20filter%3D%22url(%23g)%22%2F%3E%3C%2Fsvg%3E')]"
    />

    <!-- Left Panel - Hero -->
    <aside
      class="relative z-10 hidden overflow-hidden lg:flex lg:w-1/2 xl:w-[45%]"
    >
      <!-- Static fallback ground: also what motion-reduce viewers see -->
      <div
        class="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_0%,#1d1155_0%,#010828_62%)]"
      />
      <video
        class="absolute inset-0 size-full object-cover opacity-70 motion-reduce:hidden"
        :src="HERO_VIDEO_URL"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
      />
      <div
        class="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,8,40,0.45)_0%,rgba(1,8,40,0.72)_50%,rgba(1,8,40,0.95)_100%)]"
      />
      <div
        class="absolute inset-y-0 right-0 w-40 bg-[linear-gradient(90deg,transparent,#010828)]"
      />

      <div
        class="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14"
      >
        <slot name="hero-top" />

        <div class="flex flex-1 flex-col justify-center py-12">
          <p
            v-if="heroAccent"
            class="-mb-3 -rotate-[4deg] font-condiment text-4xl normal-case leading-none text-orbis-neon mix-blend-exclusion xl:text-5xl"
          >
            {{ heroAccent }}
          </p>
          <h1
            v-if="heroTitle"
            class="font-anton text-5xl uppercase leading-[0.92] tracking-[0.01em] text-orbis-cream xl:text-6xl"
          >
            {{ heroTitle }}
          </h1>
          <p
            v-if="heroDescription"
            class="mt-6 max-w-md font-mono text-sm leading-relaxed text-orbis-cream/55"
          >
            {{ heroDescription }}
          </p>

          <slot name="hero-features" />
        </div>

        <slot name="hero-bottom" />
      </div>
    </aside>

    <!-- Right Panel - Form column -->
    <section
      class="relative z-10 flex flex-1 flex-col items-center justify-center p-6 sm:p-10"
    >
      <slot name="top-right" />
      <slot />
    </section>
  </main>
</template>
