import { Request, Response, NextFunction } from 'express'
import fetch from 'node-fetch'
import { APIUser } from 'discord-api-types/v9'
import { PartialModelObject } from 'objection'
import {
  createPageQueryCache,
  createQueryCache,
  getInt,
  invalidateCacheWithPrefix,
  sendCachedResponse,
} from '../../utils'
import Bot from '../../database/entities/bot'
import User from '../../database/entities/user'
import { HttpUnauthorizedError } from '../../exceptions'
import { BaseMessage } from '../../message'
import BotCall from '../../database/entities/botcall'
import BotDataStore from '../../database/entities/botdatastore'
import BotCommand from '../../database/entities/botcommand'
import BotMessage from '../../database/entities/botmessage'
import { DI } from '../../di'
import { APIInteractionCall } from '../../types'
import BotInstance from '../../bot'
import { fetchBot } from '../../lib/bot'
import { exportCalls } from '../../lib/call'

export default function () {
  return {
    export: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const user: User = res.locals.auth.user

        const run = async () => {
          const bot = await fetchBot(
            Bot.query()
              .findById(parseInt(req.query.id.toString()))
              .where('ownerId', user.id)
          )

          if (!bot.premium) throw new Error('Bot is not premium')

          const workbook = exportCalls(
            [
              ...bot.messages.map((m) => m.calls).flat(),
              ...bot.commands
                .map((c) => c.calls as APIInteractionCall[])
                .flat(),
            ],
            {
              headerFooter: {
                firstFooter: `Cerus Bot #${bot.id} - ${bot.name}`,
              },
            }
          )

          res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          )
          res.setHeader(
            'Content-Disposition',
            `attachment; filename=cerus-${bot.id}.xlsx`
          )

          await workbook.xlsx.write(res)
          res.end()
        }
        run().catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
    update: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const id = parseInt(req.query.id.toString())
        const user: User = res.locals.auth.user

        const run = async () => {
          let bot = await Bot.query().findOne({ ownerId: user.id }).findById(id)

          const update: PartialModelObject<Bot> = {}
          if (typeof req.body.token === 'string') update.token = req.body.token
          if (typeof req.body.discordId === 'string')
            update.discordId = req.body.discordId

          if (Object.keys(update).length > 0)
            bot = await bot.$query().patchAndFetch(update)

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
              bot.owner = user
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

        fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bot ${token}`,
          },
        })
          .then(async (resp) => {
            const userBot = (await resp.json()) as APIUser
            if (!userBot.bot)
              throw new Error('Cannot add a non-bot user as a bot')

            if (userBot.id !== discordId.toString())
              throw new Error('Invalid discord id')

            const bot = await Bot.query().insertGraphAndFetch({
              created: new Date(new Date().toUTCString()),
              ownerId: user.id,
              discordId: discordId.toString(),
              token: token.toString(),
            })
            invalidateCacheWithPrefix('bots')
            res.json(
              new BaseMessage(
                {
                  id: bot.id,
                  discordId: bot.discordId,
                  avatar: await bot.getAvatar(),
                  created: bot.created,
                },
                'bots:create'
              )
            )
          })
          .catch((e) => next(e))
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

        const run = async () => {
          if (DI.bots.has(id)) {
            DI.bots.get(id).stop()
            DI.bots.delete(id)
          }

          await Promise.all(
            (
              await DI.stripe.subscriptions.list({
                customer: user.customerId,
              })
            ).data
              .filter(
                (sub) =>
                  (sub.items.data[0].price.metadata.type === 'bot' &&
                    sub.items.data[0].price.metadata.id === id.toString()) ||
                  (sub.items.data[0].price.metadata.type === 'command' &&
                    cmds.findIndex(
                      (c) =>
                        c.id.toString() === sub.items.data[0].price.metadata.id
                    ) !== -1)
              )
              .map(async (sub) => await DI.stripe.subscriptions.del(sub.id))
          )

          const cmds = await BotCommand.query().where('botId', id)
          for (const cmd of cmds) {
            await BotCall.query().select('commandId', cmd.id).delete()
            await cmd.$query().delete()
          }

          const msgs = await BotMessage.query().where('botId', id)
          for (const msg of msgs) {
            await BotCall.query().select('messageId', msg.id).delete()
            await msg.$query().delete()
          }

          await BotDataStore.query().where('botId', id).delete()

          const c = await Bot.query()
            .findOne({
              ownerId: user.id,
            })
            .deleteById(id)

          if (c === 0) throw new Error("Couldn't destroy bot")

          res.json(
            new BaseMessage(
              {
                id,
              },
              'bots:destroy'
            )
          )
        }

        run().catch((e) => next(e))
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
