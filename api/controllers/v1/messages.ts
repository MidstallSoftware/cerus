import { NextFunction, Request, Response } from 'express'
import { PartialModelObject, QueryBuilder } from 'objection'
import { HttpUnauthorizedError } from '../../exceptions'
import BotMessage from '../../database/entities/botmessage'
import { BaseMessage } from '../../message'
import {
  createPageQueryCache,
  createQueryCache,
  createSingleQueryCache,
  getInt,
  sendCachedResponse,
} from '../../utils'
import Bot from '../../database/entities/bot'

const transformMessage = (msg: BotMessage) => ({
  id: msg.id,
  regex: msg.regex,
  code: msg.code,
  create: (() => {
    const d = new Date()
    d.setTime(msg.created)
    return d
  })(),
})

const fetchMessage = async (query: QueryBuilder<BotMessage, BotMessage>) =>
  transformMessage(await createSingleQueryCache(BotMessage, query).read())

export default function () {
  return {
    create: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const run = async () => {
          const botId = parseInt(req.query.botId.toString())
          const regex = req.query.regex.toString()
          const bot = await createSingleQueryCache(
            Bot,
            Bot.query().findById(botId)
          ).read()
          if (bot.premium === 0)
            throw new Error('A premium bot is required for message hooks')
          const messages = await createQueryCache(
            BotMessage,
            BotMessage.query().where('botId', bot.id).where('regex', regex)
          ).read()
          if (messages.length > 0)
            throw new Error(
              `Bot message hook already exists with expression ${regex}`
            )

          const msg = await BotMessage.query().insertGraphAndFetch({
            botId,
            regex,
            created: Date.now(),
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

        BotMessage.query()
          .deleteById(parseInt(req.query.id.toString()))
          .then((count) => {
            if (count === 0) throw new Error("Couldn't delete bot command")

            res.json(
              new BaseMessage(
                {
                  id: parseInt(req.query.id.toString()),
                },
                'messages:destroy'
              )
            )
          })
          .catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
    update: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const obj: PartialModelObject<BotMessage> = {}

        if (typeof req.body.regex === 'string') obj.regex = req.body.regex
        if (typeof req.body.code === 'string') obj.code = req.body.code

        if (Object.keys(obj).length === 0) {
          throw new Error('No data was set to update')
        }

        fetchMessage(
          BotMessage.query().patchAndFetchById(
            parseInt(req.query.id.toString()),
            obj
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

      const message = await fetchMessage(
        BotMessage.query().findById(parseInt(req.query.id.toString()))
      )
      return new BaseMessage(message, 'messages:get')
    }),
    list: sendCachedResponse(async (req, res) => {
      if (!res.locals.auth && !res.locals.auth.user)
        throw new HttpUnauthorizedError('User is not authenticated')

      const offset = getInt((req.query.offset || '0').toString())
      const pageSize = getInt((req.query.count || '0').toString())

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
