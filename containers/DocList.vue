<template>
  <div :class="row ? 'container-row' : 'container'">
    <ValidationProvider v-slot="v" class="search-box">
      <vs-input
        v-model="searchTerm"
        placeholder="Search"
        type="text"
        @keyup="onSearchType"
        ><template #icon>
          <i class="material-icons">search</i>
        </template>
      </vs-input>
      <span>{{ v.errors[0] }}</span>
    </ValidationProvider>
    <div v-if="searchDocs !== null && searchTerm !== ''">
      <div v-for="(doc, index) in searchDocs" :key="index">
        <ListItem
          :title="doc.title || 'Untitled'"
          :info="doc.modifiedAt.toString()"
          :link="doc.id"
          :no-effect="row"
        />
      </div>
    </div>
    <div v-else>
      <div v-for="(doc, index) in docs" :key="index">
        <ListItem
          :title="doc.title || 'Untitled'"
          :info="doc.modifiedAt.toString()"
          :link="doc.id"
          :no-effect="row"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ValidationProvider } from 'vee-validate'
import ListItem from '../components/ListItem.vue'
export default {
  name: 'DocList',
  components: {
    ListItem,
    ValidationProvider,
  },
  props: {
    row: Boolean,
  },
  data() {
    return {
      searchDocs: null,
      searchTerm: '',
    }
  },
  computed: {
    selected() {
      if (this.$store.state.documents.meta) {
        return this.$store.state.documents.meta.id
      }
      return null
    },
    docs() {
      const createdDocs = this.$store.state.documents.createdDocs
      const editableDocs = this.$store.state.documents.editableDocs
      const viewableDocs = this.$store.state.documents.viewableDocs
      const docs = [...createdDocs, ...editableDocs, ...viewableDocs]
      return docs.sort((a, b) => a.modifiedAt - b.modifiedAt)
    },
  },
  created() {
    this.$store.dispatch(
      'documents/bindCreatedDocs',
      this.$store.state.user.uid
    )
    this.$store.dispatch(
      'documents/bindEditableDocs',
      this.$store.state.user.uid
    )
    this.$store.dispatch(
      'documents/bindViewableleDocs',
      this.$store.state.user.uid
    )
  },
  methods: {
    onSearchType() {
      console.log(this.searchTerm)
      this.searchDocs = this.docs.filter((doc) =>
        doc.title.includes(this.searchTerm)
      )
    },
  },
}
</script>

<style scoped>
.search-box {
  margin: 30px 10px 30px 30px;
}
.container-row {
  display: flex;
  max-width: 50%;
  justify-content: space-between;
  flex-wrap: wrap;
}
.container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
</style>
