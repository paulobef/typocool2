<template>
  <div v-if="!loading">
    <div v-if="valid">
      <h1>You have been added to {{ title }} {{ 'editor' }}</h1>
      <span
        >Go to<n-link :to="{ name: 'id', params: { id } }">{{
          title
        }}</n-link></span
      >
    </div>
    <div v-else>
      <h1>Sorry, you cannot access this document</h1>
      <n-link to="/" exact>Home</n-link>
    </div>
  </div>
  <div v-else>
    <loader />
  </div>
</template>

<script>
import { addPermission } from '@/utils/functions'
import loader from '@/components/loader'

export default {
  middleware: 'auth',
  layout: 'default',
  components: {
    loader,
  },
  data() {
    return {
      valid: false,
      loading: true,
    }
  },
  computed: {
    title() {
      return this.$store.state.documents.meta.title
    },
    id() {
      return this.$store.state.documents.meta.id
    },
  },
  async created() {
    console.log('add permission')
    const idToken = await this.$fireAuth.currentUser.getIdToken(true)
    try {
      const response = await addPermission(
        idToken,
        this.$route.params.id,
        this.$route.params.token
      )
      if (response.status !== 200) {
        throw new Error(
          'token did not match, you are not authorized to see this document'
        )
      }
      await this.$store.dispatch('documents/bindMeta', this.$route.params.id)
      this.valid = true
      this.loading = false
    } catch (e) {
      console.error(e)
      this.valid = false
      this.loading = false
    }
  },
}
</script>

<style scoped></style>
