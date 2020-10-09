import { firestoreAction } from 'vuexfire'
import { ActionTree, MutationTree } from 'vuex'

export interface SettingsState {
  color: string
  darkMode: boolean
  useOnlyMarkdown: boolean
}

export const state = () => ({
  color: '#5b3cc4',
  darkMode: false,
  useOnlyMarkdown: false,
})

export const actions: ActionTree<any, any>
