import { utcToZonedTime } from 'date-fns-tz'
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

  try {
    return await createSingleQueryCache(
      User,
      User.query().findOne('discordId', self.id)
    ).read()
  } catch {
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
      created: utcToZonedTime(Date.now(), 'Etc/UTC').getTime(),
    })
  }
}
