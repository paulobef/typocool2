<template>
  <n-link class="link" :to="link" prefetch>
    <div :class="noEffect ? 'container-no-effect' : 'container'">
      <div :class="noEffect ? 'sub-container-no-effect' : 'sub-container'">
        <h4>{{ title }}</h4>
        <span>{{ info }}</span>
      </div>
    </div>
  </n-link>
</template>

<script>
export default {
  name: 'ListItem',
  props: {
    title: {
      type: String,
      required: true,
    },
    info: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    noEffect: Boolean,
  },
}
</script>
<style scoped>
.container-no-effect:hover {
  transform: scale(1.2);
  transition: 0.2s ease;
}
.container:hover {
  border-left: #1963ff solid;
  transition: 0.2s ease;
}
.sub-container-no-effect {
  padding: 10px 10px 10px 30px;
}
.sub-container {
  padding: 10px 10px 10px 30px;
  transition: 0.3s ease;
}
.sub-container:hover {
  transform: translate(20px);
  transition: 0.3s ease;
}
.link {
  color: inherit;
  text-decoration: none;
}
p {
  font-size: 0.9em;
}
span {
  font-size: 0.8em;
  color: #1963ff;
}
</style>
