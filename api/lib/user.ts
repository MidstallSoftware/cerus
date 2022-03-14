import fetch from 'node-fetch'
import { APIUser } from 'discord-api-types/v9'
import User from '../database/entities/user'
import { createQueryCache } from '../utils'
import { DI } from '../di'

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

  const customer = await DI.stripe.customers.create({
    email: self.email,
    name: `${self.username}#${self.discriminator}`,
  })

  return await User.query().insertGraphAndFetch({
    discordId: self.id,
    email: self.email,
    type: 'default',
    customerId: customer.id,
    created: Date.now(),
  })
}
