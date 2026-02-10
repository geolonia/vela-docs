import { defineConfig } from 'vitepress'
import { shared } from './config/shared'
import { en } from './config/en'
import { ja } from './config/ja'

export default defineConfig({
  ...shared,

  locales: {
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      ...en,
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      link: '/ja/',
      ...ja,
    },
  },
})
