<template>
  <div>
    <vs-navbar class="navbar" shadow square center-collapsed>
      <template #left>
        <vs-button flat icon @click="activeSidebar = !activeSidebar">
          <i class="material-icons">menu</i>
        </vs-button>
        <vs-button flat icon @click="createNewDocument">
          <i class="material-icons">add</i>
        </vs-button>
      </template>
      <vs-navbar-item v-on-clickaway="stopEditing" class="name-container">
        <div v-if="updating || title === undefined"><loader /></div>
        <div v-else-if="editing || title === null || title === ''">
          <ValidationProvider v-slot="v" class="flex">
            <vs-input
              v-model="name"
              placeholder="Untitled"
              @focus="showSave = true"
            />
            <vs-button v-if="showSave" transparent @click="updateTitle"
              >Save</vs-button
            >
            <span>{{ v.errors[0] }}</span>
          </ValidationProvider>
        </div>
        <div v-else>
          <span @click="startEditing">{{ title }}</span>
        </div>
      </vs-navbar-item>

      <template #right>
        <vs-button flat icon @click="activeDocDialog = !activeDocDialog">
          <i class="material-icons">more_vert</i>
        </vs-button>
        <vs-button
          flat
          icon
          @click="activeSettingsDialog = !activeSettingsDialog"
        >
          <i class="material-icons">settings</i>
        </vs-button>
      </template>
    </vs-navbar>
    <vs-sidebar absolute :open.sync="activeSidebar">
      <DocList />
    </vs-sidebar>
    <div class="main-container">
      <nuxt />
    </div>
    <vs-dialog v-model="activeSettingsDialog">
      <template #header>
        <h4 class="not-margin">Global settings</h4>
      </template>
      <div class="dialog-content">
        <global-settings-form />
      </div>
    </vs-dialog>
    <vs-dialog v-model="activeDocDialog">
      <template #header>
        <h4 class="not-margin">Document settings</h4>
      </template>
      <div class="dialog-content">
        <doc-settings-form />
      </div>
    </vs-dialog>
  </div>
</template>

<script>
import { ValidationProvider } from 'vee-validate'
import { mixin as clickaway } from 'vue-clickaway'
import GlobalSettingsForm from '@/containers/GlobalSettingsForm'
import DocSettingsForm from '@/containers/DocSettingsForm'
import loader from '../components/loader'
import DocList from '../containers/DocList.vue'

export default {
  middleware: 'theme',
  components: {
    DocSettingsForm,
    GlobalSettingsForm,
    DocList,
    ValidationProvider,
    loader,
  },
  mixins: [clickaway],
  data: () => ({
    activeSidebar: false,
    activeSettingsDialog: false,
    activeDocDialog: false,
    name: '',
    updating: false,
    editing: false,
    showSave: false,
  }),
  computed: {
    user() {
      return this.$store.state.user
    },
    title() {
      return this.$store.state.documents.meta?.title
    },
    docId() {
      return this.$store.state.documents.meta.id
    },
  },
  beforeRouteUpdate() {
    this.name = ''
  },

  methods: {
    startEditing() {
      this.name = this.title
      this.editing = true
    },
    stopEditing() {
      console.log('stop editing')
      this.editing = false
      this.name = ''
      this.showSave = false
    },
    async updateTitle() {
      this.editing = false
      this.updating = true
      await this.$fireStore.collection('metas').doc(this.docId).update({
        title: this.name,
      })
      this.updating = false
    },
    async createNewDocument() {
      const db = this.$fireStore
      try {
        const metaDocRef = await db.collection('metas').add({
          title: '',
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          creator: this.user.uid,
          editors: [],
          viewers: [],
        })
        await db
          .collection('docs')
          .doc(metaDocRef.id)
          .set({
            version: 0,
            doc: {
              type: 'doc',
              content: [],
            },
          })
        await this.$router.push({
          path: '/' + metaDocRef.id,
          query: { q: this.q },
        })
        // we don't add steps yet
      } catch (error) {
        console.error('Error adding document: ', error)
      }
    },
    toggleSidebar() {
      this.$store.commit('toggleSidebar')
    },
  },
}
</script>
<style>
[vs-theme='dark'] {
  background-color: rgb(var(--vs-background));
  color: rgb(var(--vs-text));
}
.dialog-content {
  margin: 20px 0;
  position: relative;
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
}
.flex {
  display: flex;
}
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.list-padding {
  padding-bottom: 10px;
}
.name-container {
  padding: 0;
  margin: 0;
}
.main-container {
  padding: 120px 30px;
  max-width: 700px;
  margin: auto;
}
.center {
  display: flex;
  justify-content: center;
}
</style>
