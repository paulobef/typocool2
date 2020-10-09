import { MutationTree } from 'vuex'
import { vuexfireMutations } from 'vuexfire'

interface IUser {
  uid: string
  displayName: string
  email: string
  emailVerified: boolean
}

export const state = () => ({
  user: {} as IUser,
})

export type RootState = ReturnType<typeof state>

interface AuthStateChangedPayload {
  authUser: IUser
  claims?: any
}

export const mutations: MutationTree<RootState> = {
  ...vuexfireMutations,
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
