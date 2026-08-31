import { defineConfig } from 'histoire';
import { HstVue } from '@histoire/plugin-vue';

export default defineConfig({
  setupFile: './histoire.setup.ts',
  plugins: [HstVue()],
  collectMaxThreads: 4,
  vite: {
    server: {
      port: 6179,
    },
  },
  viteIgnorePlugins: ['vite-plugin-ruby'],
  theme: {
    darkClass: 'dark',
    title: '@luxoinbox/design',
    logo: {
      square: './public/brand-assets/logo_thumbnail.svg',
      light: './public/brand-assets/logo.svg',
      dark: './public/brand-assets/logo_dark.svg',
    },
  },
  defaultStoryProps: {
    icon: 'carbon:cube',
    iconColor: '#6FFF00',
    layout: {
      type: 'grid',
      width: '80%',
    },
  },
  tree: {
    groups: [
      {
        id: 'top',
        title: '',
      },
      {
        id: 'components',
        title: 'Components',
        include: () => true,
      },
    ],
  },
});
