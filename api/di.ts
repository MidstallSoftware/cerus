import { createClient, RedisClientType } from 'redis'
import { Knex } from 'knex'
import Stripe from 'stripe'
import waitOn from 'wait-on'
import { init as dbInit } from './database'
import BotInstance from './bot'
import Bot from './database/entities/bot'
import { startBot } from './lib/bot'
import winston from './providers/winston'

export const DI = {} as {
  stripe: Stripe
  knex: Knex
  server_start: Date
  redis: RedisClientType
  bots: Map<number, BotInstance>
}

export async function init(): Promise<void> {
  await waitOn({ resources: ['tcp:' + process.env.REDIS_HOST + ':6379'] })

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

  Bot.query()
    .where('running', true)
    .then((bots) => {
      for (const bot of bots)
        setImmediate(() =>
          startBot(bot).catch((err) =>
            winston.error(`Failed to start bot ${bot.id}`, err)
          )
        )
    })
    .catch((err) => winston.error('Failed to start bots', err))
}
