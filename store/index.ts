import { ActionTree, MutationTree } from 'vuex'
import { firestoreAction, vuexfireMutations } from 'vuexfire'
import defaultTheme from '~/constants/defaultTheme'

export interface SettingsState {
  color: string
  darkMode: boolean
  useOnlyMarkdown: boolean
}

interface IUser {
  uid: string
  displayName: string
  email: string
  emailVerified: boolean
}

export const state = () => ({
  user: null as IUser | null,
  settings: {
    color: defaultTheme.colors.primary,
    darkMode: false,
  } as SettingsState,
})

export type RootState = ReturnType<typeof state>

interface AuthStateChangedPayload {
  authUser: IUser
  claims?: any
}

export const mutations: MutationTree<RootState> = {
  ...vuexfireMutations,
  setDarkMode: (state: RootState) => {
    state.settings.darkMode = !state.settings.darkMode
  },
  ON_AUTH_STATE_CHANGED_MUTATION: (
    state: RootState,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { authUser, claims }: AuthStateChangedPayload
  ) => {
    if (!authUser) {
      return
    }
    const { uid, email, emailVerified, displayName } = authUser
    state.user = { uid, email, emailVerified, displayName }
    console.log('logged in')
  },
}

export const actions: ActionTree<RootState, RootState> = {
  nuxtClientInit: firestoreAction(async function (this: any, context) {
    const db = this.$fireStore
    // bind settings at app startup
    console.log('nuxt client init')
    if (context.state.user) {
      await context.bindFirestoreRef(
        'settings',
        db.collection('settings').doc(context.state.user.uid)
      )
    }
  }),
}
