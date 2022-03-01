import { Request, Response, NextFunction } from 'express'
import { Client } from 'discord.js'
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
import winston from '../../providers/winston'

export default function () {
  return {
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
                created: new Date(),
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
    get: (req: Request, res: Response, next: NextFunction) => {
      try {
        sendCachedResponse(req, res, async () => {
          if (!res.locals.auth && !res.locals.auth.user)
            throw new HttpUnauthorizedError('User is not authenticated')

          const id = parseInt(req.query.id.toString())
          const user: User = res.locals.auth.user

          const cache = createSingleQueryCache(
            Bot,
            Bot.query()
              .findOne({
                ownerId: user.id,
              })
              .findById(id)
              .withGraphFetched('commands'),
            'bots'
          )

          const value = await cache.read()
          return new BaseMessage(
            {
              id: value.id,
              name: value.name,
              discordId: value.discordId,
              avatar: await value.getAvatar(),
              created: value.created,
              commands: value.commands.map((cmd) => ({
                name: cmd.name,
                premium: cmd.premium,
              })),
            },
            'bots:get'
          )
        }).catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
    list: (req: Request, res: Response, next: NextFunction) => {
      try {
        sendCachedResponse(req, res, async () => {
          if (!res.locals.auth && !res.locals.auth.user)
            throw new HttpUnauthorizedError('User is not authenticated')

          const offset = getInt((req.query.offset || '0').toString())
          const pageSize = getInt((req.query.count || '0').toString())

          const send = async (results: Bot[], total: number) => {
            const avatars = await Promise.all(
              results.map(async (r) => await r.getAvatar())
            )
            return new BaseMessage(
              {
                list: results.map((bot, i) => ({
                  id: bot.id,
                  name: bot.name,
                  discordId: bot.discordId,
                  avatar: avatars[i],
                  created: bot.created,
                  commands: (bot.commands || []).map((cmd) => ({
                    name: cmd.name,
                    premium: cmd.premium,
                  })),
                })),
                total,
                pageSize,
                offset,
              },
              'bots:list'
            )
          }

          const user: User = res.locals.auth.user
          const query = Bot.query()
            .where('ownerId', user.id)
            .withGraphFetched('commands')
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
        }).catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
  }
}
