import { firestoreAction } from 'vuexfire'
import { ActionTree, MutationTree } from 'vuex'
export const state = () => ({
  // All docs metas
  createdDocs: [],
  editableDocs: [],
  viewableDocs: [],
  // Doc currently loaded in editor
  meta: {},
  doc: {},
  steps: [],
})

interface IMeta {
  title: string
  createdAt: Date
  modifiedAt: Date
  creator: string // UID
  editors: string[] // UID Array
  viewers: string[] // idem
}
interface IDoc {
  version: number
  doc: any // TODO: type this motherfucker
}
interface IStep {
  docId: string // docRef.id
  version: number
  step: any // TODO: also this motherfucker
}

interface FirestoreState {
  docs: IMeta[]
  meta: IMeta
  doc: IDoc
  steps: IStep[]
}
export const mutations: MutationTree<FirestoreState> = {
  loadDocOnce: (state, doc) => {
    state.doc = doc
  },
}

export const actions: ActionTree<FirestoreState, FirestoreState> = {
  // GET THINGS ONCE
  loadDoc: firestoreAction(async function (this: any, context, docId) {
    const db = this.$fireStore
    // get doc once
    const snap = await db.collection('docs').doc(docId).get()
    context.commit('documents/loadDocOnce', snap.data())
  }),
  // REALTIME CURRENTLY LOADED DOCUMENT UPDATES
  bindDoc: firestoreAction(async function (
    this: any,
    { bindFirestoreRef },
    docId
  ) {
    const db = this.$fireStore
    // listen to the specific doc
    console.log('binding doc')
    await bindFirestoreRef('doc', db.collection('docs').doc(docId))
  }),
  bindSteps: firestoreAction(async function (
    this: any,
    { bindFirestoreRef },
    docId
  ) {
    const db = this.$fireStore
    // listen to all steps corresponding to the doc
    await bindFirestoreRef(
      'steps',
      db
        .collection('steps')
        .where('docId', '==', docId)
        .orderBy('version', 'desc')
        .limit(50)
    )
  }),
  bindMeta: firestoreAction(async function (
    this: any,
    { bindFirestoreRef },
    docId
  ) {
    const db = this.$fireStore
    // listen to meta corresponding to doc
    await bindFirestoreRef('meta', db.collection('metas').doc(docId))
  }),
  // REALTIME DOC LIST UPDATES (ONLY CONTAINS METAS)
  bindCreatedDocs: firestoreAction(async function (
    this: any,
    { bindFirestoreRef },
    uid
  ) {
    const db = this.$fireStore
    // listen to the list of doc metas
    await bindFirestoreRef(
      'createdDocs',
      db.collection('metas').where('creator', '==', uid)
    )
  }),
  bindEditableDocs: firestoreAction(async function (
    this: any,
    { bindFirestoreRef },
    uid
  ) {
    const db = this.$fireStore
    // listen to the list of doc metas
    await bindFirestoreRef(
      'editableDocs',
      db.collection('metas').where('editor', 'array-contains', uid)
    )
  }),
  bindViewableleDocs: firestoreAction(async function (
    this: any,
    { bindFirestoreRef },
    uid
  ) {
    const db = this.$fireStore
    // listen to the list of doc metas
    await bindFirestoreRef(
      'viewableDocs',
      db.collection('metas').where('viewers', 'array-contains', uid)
    )
  }),
  // STOP LISTENING TO RT UPDATES
  unbindDoc: firestoreAction(({ unbindFirestoreRef }) => {
    unbindFirestoreRef('doc')
  }),
  unbindSteps: firestoreAction(({ unbindFirestoreRef }) => {
    unbindFirestoreRef('steps')
  }),
  unbindMeta: firestoreAction(({ unbindFirestoreRef }) => {
    unbindFirestoreRef('meta')
  }),
}
