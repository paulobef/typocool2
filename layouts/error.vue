<template>
  <div class="container">
    <div v-if="error.statusCode === 404">
      <h1>Page not found</h1>
      <p>{{ error.message }}</p>
    </div>
    <div v-else-if="error.statusCode === 403">
      <h1>Sorry, you are not authorized to view this page</h1>
    </div>
    <n-link to="/">Home page</n-link>
  </div>
</template>

<script>
export default {
  props: ['error'],
  layout: 'default', // If you prefers you can set a custom layout for the error page
}
</script>
