<template>
  <div>
    <code v-if="share.loading && !share.error">Loading share link...</code>
    <code v-else-if="share.error">{{ share.errorMessage }}</code>
    <code v-else>{{ share.link }}</code>
    <vs-button v-if="share.showButton" @click="createShareLink"
      >Create Tokens</vs-button
    >
    <div v-if="isOwner" class="list-item">
      <vs-button
        class="full-width-button"
        danger
        @click="deleteActive = !deleteActive"
        >Delete Document</vs-button
      >
    </div>
    <vs-dialog v-model="deleteActive">
      <template #header>
        <h4 class="not-margin">Delete Document</h4>
      </template>
      <div class="center list-padding list-item">
        <p>
          Are you sure you want to delete
          {{ title ? `"${title}"` : 'the currently selected" document' }}?
        </p>
      </div>
      <div class="center list-padding list-item">
        <p>This action cannot be revoked.</p>
      </div>

      <div class="center list-item">
        <vs-button danger class="full-width-button" @click="deleteDoc"
          >Delete</vs-button
        >
        <vs-button
          class="full-width-button"
          @click="deleteActive = !deleteActive"
          >Cancel</vs-button
        >
      </div>
    </vs-dialog>
  </div>
</template>

<script>
import { addToken, getShareLink } from '@/utils/functions'

export default {
  name: 'DocSettingsForm',
  data() {
    return {
      deleteActive: false,
      share: {
        link: '',
        loading: true,
        error: false,
        errorMessage: '',
        showButton: false,
      },
    }
  },
  computed: {
    user() {
      return this.$store.state.user
    },
    isOwner() {
      return (
        this.$store.state.documents.meta.creator === this.$store.state.user.uid
      )
    },
    title() {
      return this.$store.state.documents.meta.title
    },
    docId() {
      return this.$store.state.documents.meta.id
    },
  },
  async created() {
    this.share.loading = true
    await this.getShareLink(this.$route.params.id)
    if (this.share.error) {
      this.share.showButton = true
    }
    this.share.loading = false
  },
  methods: {
    async createShareLink() {
      this.share.loading = true
      const idToken = await this.$fireAuth.currentUser.getIdToken(true)
      try {
        await addToken(idToken, this.$route.params.id)
      } catch (e) {
        this.share.error = true
        console.log(e)
      }
      await this.getShareLink(this.$route.params.id)
      this.share.showButton = false
      this.share.loading = false
    },
    async getShareLink(docId) {
      // TODO: use fetch to query once the share link and store it locally
      const idToken = await this.$fireAuth.currentUser.getIdToken(true)
      const response = await getShareLink(idToken, docId, 'true')
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        this.share.loading = false
        this.share.error = true
        this.share.errorMessage =
          'Sorry there was an error loading a pre-generated share link. Click here to generate one now' // TODO: Create endpoint for link generation and button here to call endpoint.
        return
      }
      const result = await response.json()
      // const result = JSON.parse(json)
      this.share.link = result.link
      this.share.loading = false
      this.share.error = false
    },
    async deleteDoc() {
      await this.$router.push('/')
      await this.$fireStore.collection('metas').doc(this.docId).delete()
      await this.$fireStore.collection('docs').doc(this.docId).delete()
      const batch = this.$fireStore.batch()
      const stepsSnap = await this.$fireStore
        .collection('steps')
        .where('docId', '==', this.docId)
        .get()
      stepsSnap.forEach((step) => batch.delete(step.ref))
      await batch.commit()
    },
  },
}
</script>

<style scoped>
.full-width-button {
  width: 100%;
  display: block;
}
</style>
