import { Store } from 'vuex'

export default function ({
  store,
  error,
}: {
  store: Store<any>
  error: Function
}): void {
  if (!store.state.user) {
    error({
      message: 'You are not connected',
      statusCode: 403,
    })
  }
}
