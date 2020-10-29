<template>
  <div>
    <template v-if="editor && !loading">
      <div class="editor">
        <editor-content class="editor__content" :editor="editor" />
      </div>
    </template>
  </div>
</template>

<script>
import { Editor, EditorContent } from 'tiptap'
import { Step } from 'prosemirror-transform'
import {
  Blockquote,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  Collaboration,
  HardBreak,
  Heading,
  History,
  Italic,
  Link,
  ListItem,
  OrderedList,
  TodoItem,
  TodoList,
} from 'tiptap-extensions'
import schema from '../../constants/schema'

export default {
  middleware: 'auth',
  components: {
    EditorContent,
  },
  layout: 'editor',
  data() {
    return {
      version: null,
      readOnly: true,
      loading: true,
      editor: null,
      loader: null,
    }
  },
  computed: {
    user() {
      return this.$store.state.user
    },
    steps() {
      return this.$store.state.documents.steps
    },
    doc() {
      if (this.$store.state.documents.doc) {
        return this.$store.state.documents.doc.doc
      }
      return null
    },
    docVersion() {
      if (this.$store.state.documents.doc) {
        return this.$store.state.documents.doc.version
      }
      return null
    },
    meta() {
      return this.$store.state.documents.meta
    },
    creator() {
      return this.$store.state.documents.meta.creator
    },
    editors() {
      return this.$store.state.documents.meta.editors
    },
    viewers() {
      return this.$store.state.documents.meta.viewers
    },
  },
  watch: {
    steps(newSteps, _) {
      function getSteps(version, steps) {
        console.log('get steps since version: ' + version)
        try {
          return steps.filter((step) => step.version > version)
        } catch (e) {
          return []
        }
      }

      const pmSteps = newSteps.map((newStep) => {
        const { step, version, clientID } = newStep
        return { step, version, clientID }
      })
      const steps = getSteps(this.version, pmSteps.reverse())
      if (this.editor && steps && steps.length) {
        console.log('collab will update with these steps: ', steps)
        this.editor.extensions.options.collaboration.update({
          steps,
          version: this.docVersion, // steps[steps.length - 1].version,
        })
        console.log('client doc updated with steps')
        this.version = this.docVersion // steps[steps.length - 1].version
      }
    },
  },
  async created() {
    this.openLoading()
    await this.unbindStore()
    await this.loadStore(this.$route.params.id)
    this.init()
    console.log('created')
  },
  async routeUpdated(_, __) {
    this.openLoading()
    await this.unbindStore()
    await this.loadStore(this.$route.params.id)
    this.init()
  },
  beforeDestroy() {
    if (this.editor) this.editor.destroy()
  },
  methods: {
    async unbindStore() {
      await this.$store.dispatch('documents/unbindDoc')
      await this.$store.dispatch('documents/unbindSteps')
      await this.$store.dispatch('documents/unbindMeta')
    },
    async loadStore(id) {
      // get the doc initial doc and listen for the steps.
      await this.$store.dispatch('documents/bindDoc', id)
      await this.$store.dispatch('documents/bindSteps', id)
      // we load meta first to check permissions before loading actual content
      await this.$store.dispatch('documents/bindMeta', id)
    },
    openLoading() {
      this.loader = this.$vs.loading({
        color: 'blue',
      })
    },
    toggleSidebar() {
      this.$store.commit('toggleSidebar')
    },
    init() {
      console.log(this.creator)
      if (!this.creator) {
        this.loader?.close()
        console.log('throw 404')
        this.$nuxt.context.error({
          message: 'Sorry, this doc could not be found',
          statusCode: 404,
        })
        return
      }
      // if user is creator, skip this part, he has all the rights
      if (this.creator !== this.user.uid) {
        if (
          !this.viewers.includes(this.user.uid) &&
          !this.editors.includes(this.user.uid)
        ) {
          this.loader?.close()
          console.log('unauthorized')
          this.$nuxt.context.error({
            message: 'Sorry, you are not authorized to view this document',
            statusCode: 403,
          })
        }
        this.readOnly = this.viewers.includes(this.user.uid)
      }

      // create editor
      this.onInit(
        { doc: this.doc, version: this.docVersion },
        this.$route.params.id
      )

      console.log('editor mounted')
    },
    onInit({ doc, version }, docId) {
      if (this.editor) {
        this.editor.destroy()
      }
      this.version = version
      console.log(doc, version)
      this.editor = new Editor({
        extensions: [
          new Blockquote(),
          new BulletList(),
          new CodeBlock(),
          new HardBreak(),
          new Heading({ levels: [1, 2, 3] }),
          new ListItem(),
          new OrderedList(),
          new TodoItem(),
          new TodoList(),
          new Bold(),
          new Code(),
          new Italic(),
          new Link(),
          new History(),
          new Collaboration({
            // the initial version we start with
            // version is an integer which is incremented with every change

            version,
            // debounce changes so we can save some requests
            debounce: 250,
            // onSendable is called whenever there are changed we have to send to our server
            onSendable: async ({ sendable }) => {
              const db = this.$fireStore
              const { version, clientID, steps } = sendable
              this.version = version
              console.log('updated local version to: ', this.version)
              const docRef = db.collection('docs').doc(docId)
              await db.runTransaction(async (transaction) => {
                const storedDocRef = await transaction.get(docRef)
                const storedDoc = storedDocRef.data()
                console.log('stored doc: ', storedDoc)
                if (storedDoc.version !== version) {
                  console.log(
                    'must sync first. Stored version: ' +
                      storedDoc.version +
                      ', client version: ' +
                      version
                  )
                  return 'fetch' // we end transaction here because we must wait for client to sync with DB automatically before inserting
                  // NOTE: or we manually emit an update using an "update" doc in sync with client
                }

                let doc = schema.nodeFromJSON(storedDoc.doc)
                const newSteps = steps.map((step) => {
                  const newStep = Step.fromJSON(schema, step)
                  newStep.clientID = clientID

                  // apply step to document
                  const result = newStep.apply(doc)
                  doc = result.doc

                  return newStep
                })
                // calculating a new version number is easy
                const newVersion = version + newSteps.length
                console.log('new version: ', newVersion)

                function storeSteps(db, transaction, { version, steps }) {
                  steps.forEach(async (step, index) => {
                    // we build a new new step that will carry a docId so we can match it we the correct document
                    const newStep = {
                      step: JSON.parse(JSON.stringify(step)),
                      version: version + index + 1,
                      clientID: step.clientID,
                      docId,
                    }

                    // we create an firestore doc id before adding the step
                    const docRef = db.collection('steps').doc()
                    await transaction.set(docRef, newStep)
                    console.log('step stored: ', newStep)
                  })
                }

                // store the doc so future editor can initiate with the correct content and version
                await transaction.update(docRef, {
                  version: newVersion,
                  doc: doc.toJSON(),
                })
                // store new steps so everyone listening to the collection can collect them
                storeSteps(db, transaction, { version, steps: newSteps })
                return null

                // updates are sent to client automatically
                // NOTE:  maybe have an "update" doc which is used to emit updates
              })
            },
          }),
        ],
        content: doc,
      })
      this.loading = false
      this.loader?.close()
      console.log('editor created')
    },
  },
}
</script>
