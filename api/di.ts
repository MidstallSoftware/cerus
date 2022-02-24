import { Knex } from 'knex'
import Stripe from 'stripe'
import { init as dbInit } from './database'

export const DI = {} as {
  stripe: Stripe
  knex: Knex
  server_start: Date
}

export async function init(): Promise<void> {
  DI.stripe = new Stripe(process.env.STRIPE_KEY, {
    apiVersion: '2020-08-27',
    typescript: true,
  })
  DI.knex = await dbInit()
  DI.server_start = new Date()
}
