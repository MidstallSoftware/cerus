import fetch from 'node-fetch'
import { APIUser } from 'discord-api-types/v9'
import User from '../database/entities/user'
import { createSingleQueryCache } from '../utils'
import { DI } from '../di'

export async function checkUser(header: string): Promise<User> {
  const self = (await (
    await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: header,
      },
    })
  ).json()) as APIUser

  const query = await createSingleQueryCache(
    User,
    User.query().findOne('discordId', self.id)
  ).read()
  if (typeof query !== 'undefined') return query

  const customers = await DI.stripe.customers.list({
    email: self.email,
  })
  const customer =
    customers.data.length === 0
      ? await DI.stripe.customers.create({
          email: self.email,
          name: `${self.username}#${self.discriminator}`,
        })
      : customers.data[0]

  return await User.query().insertGraphAndFetch({
    discordId: self.id,
    email: self.email,
    type: 'default',
    customerId: customer.id,
    created: Date.now(),
  })
}
