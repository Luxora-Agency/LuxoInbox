<!--
  Presentational only: the Orbis liquid-glass surface.
  Zero state, zero logic. A single root element so a parent `class`
  (e.g. `animate-wiggle`) merges through attribute fallthrough.
-->
<template>
  <div
    class="relative isolate rounded-2xl bg-white/[0.01] backdrop-blur-[4px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:p-[1.4px] before:content-[''] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,255,255,0.15)_20%,transparent_35%,transparent_65%,rgba(255,255,255,0.15)_80%,rgba(255,255,255,0.45))] before:[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] before:[mask-composite:exclude]"
  >
    <slot />
  </div>
</template>
