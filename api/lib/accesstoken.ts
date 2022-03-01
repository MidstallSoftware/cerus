import AccessToken from '../database/entities/accesstoken'
import { createQueryCache } from '../utils'
import { checkUser } from './user'

export async function checkAccessToken(header: string): Promise<AccessToken> {
  const query = await createQueryCache(
    AccessToken,
    AccessToken.query()
      .where('token', header)
      .orderBy('id')
      .withGraphFetched('user')
  ).read()
  if (query.length > 0) return query[0]
  const user = await checkUser(header)
  return await AccessToken.query().insertGraphAndFetch({
    token: header,
    userId: user.id,
  })
}
