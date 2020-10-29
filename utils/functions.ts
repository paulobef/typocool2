const defaultHeaders = (idToken: string) =>
  // @ts-ignore
  new Headers({
    Authorization: `Bearer ${idToken}`,
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Origin': '*',
  })
const defaultInit = {
  method: 'GET',
  headers: new Headers(),
  mode: 'cors',
  cache: 'default',
}

export const cfunctions = (
  endpoint: string,
  method?: string,
  options?: { [key: string]: any }
) => {
  const init: { [key: string]: any } = { ...defaultInit }
  if (method !== defaultInit.method) {
    init.method = method
  }

  if (options) {
    for (const prop in defaultInit) {
      // eslint-disable-next-line no-prototype-builtins
      if (options.hasOwnProperty(prop)) {
        init[prop] = options[prop]
      }
    }
  }

  return async function (idToken?: string, ...params: string[]) {
    if (idToken) {
      init.headers = defaultHeaders(idToken)
    }
    return await fetch(
      `http://localhost:5001/typocool2/us-central1/default/${endpoint}/${params.join(
        '/'
      )}`,
      init
    )
  }
}

export const getShareLink = cfunctions('getShareLinks', 'GET')
export const addToken = cfunctions('addTokens', 'POST')
export const addPermission = cfunctions('addPermission', 'POST')
