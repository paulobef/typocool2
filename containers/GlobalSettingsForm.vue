<template>
  <div>
    <div class="list-padding list-item">
      <span>Dark Mode</span>
      <vs-switch :value="darkMode" dark @click="onDarkModeChange">
        <template #circle>
          <i v-if="!darkMode" class="material-icons">nights_stay</i>
          <i v-else class="material-icons white">wb_sunny</i>
        </template>
      </vs-switch>
    </div>
    <div class="list-padding list-item">
      <span>Accent color</span>
      <vs-button @click="colorPickerActive = !colorPickerActive"
        >Choose</vs-button
      >
    </div>
    <vs-dialog v-model="colorPickerActive">
      <template #header>
        <h4 class="not-margin">Select an accent color</h4>
      </template>
      <div class="center">
        <ColorPicker
          class="center"
          :width="200"
          :height="200"
          :disabled="false"
          :start-color="color"
          @colorChange="onColorChange"
        ></ColorPicker>
      </div>
    </vs-dialog>
  </div>
</template>

<script>
import ColorPicker from 'vue-color-picker-wheel'
import defaultTheme from '../constants/defaultTheme'

export default {
  name: 'GlobalSettingsForm',
  components: {
    ColorPicker,
  },
  data() {
    return {
      colorPickerActive: false,
    }
  },
  computed: {
    user() {
      return this.$store.state.user
    },
    darkMode() {
      if (this.$store.state.settings && this.$store.state.settings.darkMode)
        return this.$store.state.settings.darkMode
      return false
    },
    color() {
      if (this.$store.state.settings) return this.$store.state.settings.color
      return defaultTheme.colors.primary
    },
  },
  methods: {
    onColorChange(color) {
      console.log(color)
      this.$vs.setColor('primary', color)
      this.$fireStore.collection('settings').doc(this.user.uid).set({
        darkMode: this.darkMode,
        color,
      })
    },
    onDarkModeChange() {
      console.log(this.darkMode)
      this.$vs.toggleTheme()
      this.$fireStore.collection('settings').doc(this.user.uid).set({
        color: this.color,
        darkMode: !this.darkMode,
      })
    },
  },
}
</script>

<style scoped>
.white {
  color: white;
}
</style>
