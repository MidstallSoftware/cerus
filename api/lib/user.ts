import fetch from 'node-fetch'
import { APIUser } from 'discord-api-types'
import User from '../database/entities/user'
import { createQueryCache } from '../utils'

export async function checkUser(header: string): Promise<User> {
  const self = (await (
    await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: header,
      },
    })
  ).json()) as APIUser

  const query = await createQueryCache(
    User,
    User.query().where('discordId', self.id)
  ).read()
  if (query.length > 0) return query[0]

  return await User.query().insertGraphAndFetch({
    discordId: self.id,
    email: self.email,
    type: 'default',
    created: Date.now(),
  })
}
