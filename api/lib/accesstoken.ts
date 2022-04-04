import AccessToken from '../database/entities/accesstoken'
import winston from '../providers/winston'
import { createQueryCache } from '../utils'
import { checkUser } from './user'

export async function checkAccessToken(header: string): Promise<AccessToken> {
  const cache = createQueryCache(
    AccessToken,
    AccessToken.query()
      .where('token', header)
      .whereNull('deletedAt')
      .orderBy('id')
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
  } catch (e) {
    winston.error('Failed to insert', e)
    const t = await cache.read()
    if (typeof t !== 'undefined') t[0].user = user
    return t[0]
  }

  token.user = user
  await cache.invalidate()
  await AccessToken.query().whereNot('token', header).delete()
  return token
}
