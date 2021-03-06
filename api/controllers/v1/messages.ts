import { NextFunction, Request, Response } from 'express'
import { PartialModelObject } from 'objection'
import { HttpUnauthorizedError } from '../../exceptions'
import BotCall from '../../database/entities/botcall'
import BotMessage from '../../database/entities/botmessage'
import User from '../../database/entities/user'
import { BaseMessage } from '../../message'
import {
  createPageQueryCache,
  createQueryCache,
  createSingleQueryCache,
  getInt,
  sendCachedResponse,
} from '../../utils'
import Bot from '../../database/entities/bot'
import { transformMessage, fetchMessage } from '../../lib/message'
import { exportCalls } from '../../lib/call'

export default function () {
  return {
    export: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const user: User = res.locals.auth.user

        const run = async () => {
          const message = await fetchMessage(
            BotMessage.query()
              .findById(parseInt(req.query.id.toString()))
              .whereIn(
                'botId',
                Bot.query().select('bots.id').where('ownerId', user.id)
              )
          )

          const workbook = exportCalls(message.calls, {
            headerFooter: {
              firstFooter: `Cerus Command #${message.id} (${message.botId}) - ${message.regex}`,
            },
          })

          res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          )
          res.setHeader(
            'Content-Disposition',
            `attachment; filename=cerus-${message.botId}-${message.id}.xlsx`
          )

          await workbook.xlsx.write(res)
          res.end()
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

        const run = async () => {
          const botId = parseInt(req.query.botId.toString())
          const regex = req.query.regex.toString()
          const user: User = res.locals.auth.user
          const bot = await createSingleQueryCache(
            Bot,
            Bot.query().findById(botId)
          ).read()
          if (bot.premium === 0)
            throw new Error('A premium bot is required for message hooks')
          const messages = await createQueryCache(
            BotMessage,
            BotMessage.query()
              .where('botId', bot.id)
              .where('regex', regex)
              .whereIn(
                'botId',
                Bot.query().select('bots.id').where('ownerId', user.id)
              )
          ).read()
          if (messages.length > 0)
            throw new Error(
              `Bot message hook already exists with expression ${regex}`
            )

          const msg = await BotMessage.query().insertGraphAndFetch({
            botId,
            regex,
            createdAt: new Date(new Date().toUTCString()),
          })

          res.json(new BaseMessage(transformMessage(msg), 'messages:create'))
        }

        run().catch((e) => next(e))
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
          await BotCall.query()
            .where('messageId', id)
            .patchAndFetch({
              deletedAt: new Date(new Date().toUTCString()),
            })

          await BotMessage.query()
            .patchAndFetch({
              deletedAt: new Date(new Date().toUTCString()),
            })
            .whereIn(
              'botId',
              Bot.query().select('bots.id').where('ownerId', user.id)
            )

          res.json(
            new BaseMessage(
              {
                id,
              },
              'messages:destroy'
            )
          )
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
        const obj: PartialModelObject<BotMessage> = {
          updatedAt: new Date(new Date().toUTCString()),
        }

        if (typeof req.body.regex === 'string') obj.regex = req.body.regex
        if (typeof req.body.code === 'string') obj.code = req.body.code

        if (Object.keys(obj).length === 1) {
          throw new Error('No data was set to update')
        }

        fetchMessage(
          BotMessage.query()
            .patchAndFetchById(id, obj)
            .whereIn(
              'botId',
              Bot.query().select('bots.id').where('ownerId', user.id)
            )
        )
          .then((data) => {
            res.json(new BaseMessage(data, 'messages:update'))
          })
          .catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
    get: sendCachedResponse(async (req, res) => {
      if (!res.locals.auth && !res.locals.auth.user)
        throw new HttpUnauthorizedError('User is not authenticated')

      const user: User = res.locals.auth.user
      const message = await fetchMessage(
        BotMessage.query()
          .findById(parseInt(req.query.id.toString()))
          .whereIn(
            'botId',
            Bot.query().select('bots.id').where('ownerId', user.id)
          )
      )
      return new BaseMessage(message, 'messages:get')
    }),
    list: sendCachedResponse(async (req, res) => {
      if (!res.locals.auth && !res.locals.auth.user)
        throw new HttpUnauthorizedError('User is not authenticated')

      const offset = getInt((req.query.offset || '0').toString())
      const pageSize = getInt((req.query.count || '0').toString())
      const user: User = res.locals.auth.user

      const send = async (results: BotMessage[], total: number) => {
        const list = await Promise.all(
          results.map(({ id }) => fetchMessage(BotMessage.query().findById(id)))
        )
        return new BaseMessage(
          {
            list,
            total,
            pageSize,
            offset,
          },
          'messages:list'
        )
      }

      const query = BotMessage.query()
        .where('botId', parseInt(req.query.botId.toString()))
        .whereNull('deletedAt')
        .whereIn(
          'botId',
          Bot.query().select('bots.id').where('ownerId', user.id)
        )
        .select('id')
      if (pageSize > 0) {
        const cache = await createPageQueryCache(
          BotMessage,
          query.page(offset, pageSize),
          'commands'
        ).read()
        return await send(cache.results, cache.total)
      } else {
        const cache = await createQueryCache(
          BotMessage,
          query,
          'commands'
        ).read()
        return await send(cache, cache.length)
      }
    }),
  }
}
