import fetch from 'node-fetch'
import User from '../database/entities/user'

export async function checkUser(header: string): Promise<User> {
  const self: Record<string, any> = await (
    await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: header,
      },
    })
  ).json()

  const query = await User.query().where('discordId', self.id)
  if (query.length > 0) return query[0]

  return await User.query().insertGraphAndFetch({
    discordId: self.id,
    email: self.email,
    type: 'default',
    created: new Date(),
  })
}
