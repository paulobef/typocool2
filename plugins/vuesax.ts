import Vue from 'vue'
import Vuesax from 'vuesax'
import { Plugin } from '@nuxt/types'
import defaultTheme from '../constants/defaultTheme'

Vue.use(Vuesax, {
  theme: defaultTheme,
})

const VuesaxPlugin: Plugin = (_: any, inject) => {
  inject('vs', Vue.prototype.$vs)
}

export default VuesaxPlugin
