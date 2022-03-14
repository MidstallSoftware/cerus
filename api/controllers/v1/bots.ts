import { Request, Response, NextFunction } from 'express'
import { Client } from 'discord.js'
import { QueryBuilder } from 'objection'
import {
  createPageQueryCache,
  createQueryCache,
  createSingleQueryCache,
  getInt,
  invalidateCacheWithPrefix,
  sendCachedResponse,
} from '../../utils'
import Bot from '../../database/entities/bot'
import User from '../../database/entities/user'
import { HttpUnauthorizedError } from '../../exceptions'
import { BaseMessage } from '../../message'
import BotCommand from '../../database/entities/botcommand'
import BotMessage from '../../database/entities/botmessage'
import winston from '../../providers/winston'
import { APIBot } from '../../types'
import { DI } from '../../di'
import BotInstance from '../../bot'

async function fetchBot(query: QueryBuilder<Bot, Bot>): Promise<APIBot> {
  const cache = createSingleQueryCache(Bot, query, 'bots')

  const value = await cache.read()

  const cacheMessages = createQueryCache(
    BotMessage,
    BotMessage.query().where('botId', value.id),
    'messages'
  )
  const cacheCommands = createQueryCache(
    BotCommand,
    BotCommand.query().where('botId', value.id),
    'commands'
  )

  const valueMessages = await cacheMessages.read()
  const valueCommands = await cacheCommands.read()

  return {
    id: value.id,
    name: value.name,
    discordId: value.discordId,
    avatar: await value.getAvatar(),
    running: DI.bots.has(value.id),
    created: (() => {
      const d = new Date()
      d.setTime(value.created)
      return d
    })(),
    premium: value.premium === 1,
    messages: valueMessages.map((msg) => ({
      id: msg.id,
      regex: msg.regex,
    })),
    commands: valueCommands.map((cmd) => ({
      id: cmd.id,
      name: cmd.name,
      premium: cmd.premium === 1,
      created: (() => {
        const d = new Date()
        d.setTime(cmd.created)
        return d
      })(),
      code: cmd.code,
    })),
  }
}

export default function () {
  return {
    update: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const id = parseInt(req.query.id.toString())
        const user: User = res.locals.auth.user

        const run = async () => {
          const bot = await Bot.query()
            .findOne({ ownerId: user.id })
            .findById(id)

          if (typeof req.body.running === 'boolean') {
            const running = req.body.running as boolean
            if (DI.bots.has(id) && !running) {
              DI.bots.get(id).stop()
              DI.bots.delete(id)
            } else if (!DI.bots.has(id) && running) {
              const cacheMessages = createQueryCache(
                BotMessage,
                BotMessage.query().where('botId', bot.id),
                'messages'
              )
              const cacheCommands = createQueryCache(
                BotCommand,
                BotCommand.query().where('botId', bot.id),
                'commands'
              )

              const valueMessages = await cacheMessages.read()
              const valueCommands = await cacheCommands.read()
              bot.messages = valueMessages
              bot.commands = valueCommands
              const inst = new BotInstance(bot)
              await inst.init()
              DI.bots.set(id, inst)
            }
          }

          res.json(
            new BaseMessage(
              await fetchBot(
                Bot.query().findOne({ ownerId: user.id }).findById(id)
              ),
              'bots:update'
            )
          )
        }

        run().catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
    create: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const { discordId, token } = req.query
        const user: User = res.locals.auth.user

        const client = new Client({
          intents: [],
        })

        client.on('ready', () => {
          try {
            if (!client.user.bot)
              throw new Error('Cannot add a non-bot user as a bot')

            Bot.query()
              .insertGraph({
                name: client.user.username,
                created: Date.now(),
                ownerId: user.id,
                discordId: discordId.toString(),
                token: token.toString(),
              })
              .then(async (bot) => {
                invalidateCacheWithPrefix('bots')
                  .then(() => {})
                  .catch((e) => winston.error(e))
                res.json(
                  new BaseMessage(
                    {
                      id: bot.id,
                      name: bot.name,
                      discordId: bot.discordId,
                      avatar: await bot.getAvatar(),
                      created: bot.created,
                    },
                    'bots:create'
                  )
                )
              })
              .catch((e) => next(e))

            client.destroy()
          } catch (e) {
            next(e)
          }
        })

        client.login(token.toString()).catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
    destroy: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const id = parseInt(req.query.id.toString())
        const user: User = res.locals.auth.user

        Bot.query()
          .findOne({
            ownerId: user.id,
          })
          .deleteById(id)
          .then(async (c) => {
            if (c === 0) throw new Error("Couldn't destroy bot")

            const commandCount = await BotCommand.query()
              .where('botId', id)
              .delete()

            invalidateCacheWithPrefix('bots')
              .then(() => {})
              .catch((e) => winston.error(e))
            res.json(
              new BaseMessage(
                {
                  id,
                  commandCount,
                },
                'bots:destroy'
              )
            )
          })
          .catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
    get: sendCachedResponse(async (req, res) => {
      if (!res.locals.auth && !res.locals.auth.user)
        throw new HttpUnauthorizedError('User is not authenticated')

      const id = parseInt(req.query.id.toString())
      const user: User = res.locals.auth.user

      const bot = await fetchBot(
        Bot.query().findOne({ ownerId: user.id }).findById(id)
      )
      return new BaseMessage(bot, 'bots:get')
    }),
    list: sendCachedResponse(async (req, res) => {
      if (!res.locals.auth && !res.locals.auth.user)
        throw new HttpUnauthorizedError('User is not authenticated')

      const offset = getInt((req.query.offset || '0').toString())
      const pageSize = getInt((req.query.count || '0').toString())

      const send = async (results: Bot[], total: number) => {
        const list = await Promise.all(
          results.map(({ id }) => fetchBot(Bot.query().findById(id)))
        )
        return new BaseMessage(
          {
            list,
            total,
            pageSize,
            offset,
          },
          'bots:list'
        )
      }

      const user: User = res.locals.auth.user
      const query = Bot.query().where('ownerId', user.id).select('id')
      if (pageSize > 0) {
        const cache = await createPageQueryCache(
          Bot,
          query.page(offset, pageSize),
          'bots'
        ).read()
        return await send(cache.results, cache.total)
      } else {
        const cache = await createQueryCache(Bot, query, 'bots').read()
        return await send(cache, cache.length)
      }
    }),
  }
}
