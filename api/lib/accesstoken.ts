import AccessToken from '../database/entities/accesstoken'
import { checkUser } from './user'

export async function checkAccessToken(header: string): Promise<AccessToken> {
  const query = await AccessToken.query().where('token', header).orderBy('id')
  const user = await checkUser(header)
  if (query.length > 0) {
    query[0].user = user
    return query[0]
  }

  const accessToken = await AccessToken.query().insertGraphAndFetch({
    token: header,
    userId: user.id,
  })
  accessToken.user = user
  return accessToken
}
