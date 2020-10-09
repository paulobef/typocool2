export default {
  // Disable server-side rendering (https://go.nuxtjs.dev/ssr-mode)
  ssr: false,

  // Target (https://go.nuxtjs.dev/config-target)
  target: 'static',

  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    title: 'typocool2',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: ['vuesax/dist/vuesax.css', 'material-icons/iconfont/material-icons.css'],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: ['@/plugins/vuesax'],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
    '@nuxtjs/firebase',
  ],

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
    transpile: ['vee-validate/dist/rules'],
  },

  firebase: {
    config: {
      apiKey: 'AIzaSyDoE5zFtIP5jxoNC1M327pOL2IQlinrmH4',
      authDomain: 'typocool2.firebaseapp.com',
      databaseURL: 'https://typocool2.firebaseio.com',
      projectId: 'typocool2',
      storageBucket: 'typocool2.appspot.com',
      messagingSenderId: '402729586030',
      appId: '1:402729586030:web:b6103f51836645aca2c57f',
      measurementId: 'G-2511Z1SKXC',
    },
    services: {
      auth: {
        persistence: 'local', // default
        initialize: {
          onAuthStateChangedMutation: 'ON_AUTH_STATE_CHANGED_MUTATION',
        },
        ssr: false, // default
      },
      firestore: {
        memoryOnly: false, // default
        static: false, // default
        preload: false, // default
        chunkName:
          process.env.NODE_ENV !== 'production' ? 'firebase-auth' : '[id]', // default
        enablePersistence: false,
        settings: {
          // Firestore Settings - currently only works in SPA mode
        },
      },
      storage: true,
      analytics: true,
    },
  },
}
