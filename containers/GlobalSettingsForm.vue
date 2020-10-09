<template>
  <div>
    <ColorPicker
      :width="200"
      :height="200"
      :disabled="false"
      start-color="#1963ff"
      @colorChange="onColorChange"
    ></ColorPicker>
  </div>
</template>

<script>
import ColorPicker from 'vue-color-picker-wheel'

export default {
  name: 'GlobalSettingsForm',
  components: {
    ColorPicker,
  },
  methods: {
    onColorChange(color) {
      this.$vs.setColor('primary', color)
      this.$vs.toggleTheme()
    },
  },
}
</script>

<style scoped></style>
