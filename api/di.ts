import { createClient, RedisClientType } from 'redis'
import { Knex } from 'knex'
import Stripe from 'stripe'
import waitOn from 'wait-on'
import { init as dbInit } from './database'
import BotInstance from './bot'
import Bot from './database/entities/bot'
import { startBot } from './lib/bot'
import winston from './providers/winston'
import { initMail, Mailer } from './mail'

const env = process.env.NODE_ENV || 'development'
const production = env === 'production'

export const DI = {} as {
  stripe: Stripe
  knex: Knex
  server_start: Date
  redis: RedisClientType
  mail: Mailer
  bots: Map<number, BotInstance>
}

export async function init(): Promise<void> {
  await waitOn({
    resources: [
      'tcp:' + process.env.REDIS_HOST + ':6379',
      production
        ? undefined
        : 'tcp:' +
          process.env.EMAIL_HOST +
          ':' +
          (process.env.EMAIL_PORT || 25),
    ].filter((v) => v !== undefined),
  })

  DI.redis = createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}`,
  })
  await DI.redis.connect()

  DI.stripe = new Stripe(process.env.STRIPE_KEY, {
    apiVersion: '2020-08-27',
    typescript: true,
  })
  DI.knex = await dbInit()

  DI.server_start = new Date()
  DI.bots = new Map()
  DI.mail = await initMail()

  Bot.query()
    .where('running', true)
    .then((bots) => {
      for (const bot of bots)
        setImmediate(() => {
          if (!DI.bots.has(bot.id))
            startBot(bot).catch((err) =>
              winston.error(`Failed to start bot ${bot.id}`, err)
            )
        })
    })
    .catch((err) => winston.error('Failed to start bots', err))
}
