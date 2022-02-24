import AccessToken from '../database/entities/accesstoken'
import { checkUser } from './user'

export async function checkAccessToken(header: string): Promise<AccessToken> {
  const query = await AccessToken.query()
    .where('token', header)
    .orderBy('id')
    .withGraphFetched('user')
  if (query.length > 0) return query[0]
  return await AccessToken.query().insert({
    token: header,
    user: await checkUser(header),
  })
}
