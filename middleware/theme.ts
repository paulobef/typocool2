import { Middleware } from '@nuxt/types'

const theme: Middleware = (context) => {
  console.log('theme middleware')
  if (!context.store.state.settings) return
  const { darkMode, color } = context.store.state.settings
  if (darkMode) {
    context.app.$vs.setTheme('dark')
  }
  if (color) {
    context.app.$vs.setColor('primary', color)
  }
}

export default theme
