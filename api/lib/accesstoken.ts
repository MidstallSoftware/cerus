import AccessToken from '../database/entities/accesstoken'
import { createQueryCache } from '../utils'
import { checkUser } from './user'

export async function checkAccessToken(header: string): Promise<AccessToken> {
  const cache = createQueryCache(
    AccessToken,
    AccessToken.query().where('token', header).orderBy('id')
  )

  let token = (await cache.read())[0]

  const user = await checkUser(header)
  if (typeof token !== 'undefined') {
    token.user = user
    return token
  }

  try {
    token = await AccessToken.query().insertGraphAndFetch({
      token: header,
      userId: user.id,
    })
  } catch {
    const t = await cache.read()
    if (typeof t !== 'undefined') t[0].user = user
    return t[0]
  }

  token.user = user
  await cache.invalidate()
  return token
}
