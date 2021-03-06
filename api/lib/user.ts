import { PartialModelObject } from 'objection'
import Stripe from 'stripe'
import fetch from 'node-fetch'
import { APIUser } from 'discord-api-types/v9'
import User from '../database/entities/user'
import { DI } from '../di'
import { createQueryCache } from '../utils'

export async function checkUser(header: string): Promise<User> {
  const self = (await (
    await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: header,
      },
    })
  ).json()) as APIUser

  const username = `${self.username}#${self.discriminator}`
  const userCache = createQueryCache(
    User,
    User.query().where('discordId', self.id).whereNull('deletedAt')
  )
  let user = (await userCache.read())[0]

  if (typeof user !== 'undefined') {
    const customer: Stripe.Customer = (await DI.stripe.customers.retrieve(
      user.customerId
    )) as Stripe.Response<Stripe.Customer>

    const dbUpdate: PartialModelObject<User> = {}
    const stripeUpdate: Stripe.CustomerUpdateParams = {}

    if (user.email !== self.email) dbUpdate.email = self.email

    if (customer.email !== self.email) stripeUpdate.email = self.email
    if (customer.name !== username) stripeUpdate.name = username

    if (Object.keys(stripeUpdate).length > 0)
      await DI.stripe.customers.update(user.customerId, stripeUpdate)

    if (Object.keys(dbUpdate).length > 0)
      return await user.$query().patchAndFetch(dbUpdate)
    return user
  } else {
    if (
      ((
        (
          await createQueryCache(
            User,
            User.query().whereNull('deletedAt').count('id')
          ).read()
        )[0] as any
      )['count(`id`)'] as number) === 15
    )
      throw new Error(
        'Cannot sign up at this moment, currently capped at 15 users for QA testing'
      )

    const customers = await DI.stripe.customers.list({
      email: self.email,
    })
    const customer =
      customers.data.length === 0
        ? await DI.stripe.customers.create({
            email: self.email,
            name: username,
          })
        : customers.data[0]

    try {
      user = await User.query().insertGraphAndFetch({
        discordId: self.id,
        email: self.email,
        type: 'default',
        customerId: customer.id,
        createdAt: new Date(new Date().toUTCString()),
      })
    } catch {
      return (await userCache.read())[0]
    }

    await userCache.invalidate()
    return user
  }
}
