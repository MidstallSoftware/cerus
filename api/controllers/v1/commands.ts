import { NextFunction, Request, Response } from 'express'
import { PartialModelObject, QueryBuilder } from 'objection'
import { HttpUnauthorizedError } from '../../exceptions'
import BotCommand from '../../database/entities/botcommand'
import { BaseMessage } from '../../message'
import {
  createPageQueryCache,
  createQueryCache,
  createSingleQueryCache,
  getInt,
  sendCachedResponse,
} from '../../utils'
import Bot from '../../database/entities/bot'

const transformCommand = (cmd: BotCommand) => ({
  id: cmd.id,
  botId: cmd.botId,
  name: cmd.name,
  premium: cmd.premium === 1,
  code: cmd.code,
  created: (() => {
    const d = new Date()
    d.setTime(cmd.created)
    return d
  })(),
})

const fetchCommand = async (query: QueryBuilder<BotCommand, BotCommand>) =>
  transformCommand(await createSingleQueryCache(BotCommand, query).read())

export default function () {
  return {
    create: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const run = async () => {
          const botId = parseInt(req.query.botId.toString())
          const name = req.query.name.toString()
          const bot = await createSingleQueryCache(
            Bot,
            Bot.query().findById(botId)
          ).read()
          const commands = await createQueryCache(
            BotCommand,
            BotCommand.query().where('botId', bot.id).where('name', name)
          ).read()
          if (commands.length > 0)
            throw new Error(
              `Bot command already exists with name ${req.query.name}`
            )

          const cmd = await BotCommand.query().insertGraphAndFetch({
            botId,
            name,
            premium: 0,
            created: Date.now(),
          })

          res.json(new BaseMessage(transformCommand(cmd), 'commands:create'))
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

        BotCommand.query()
          .deleteById(parseInt(req.query.id.toString()))
          .then((count) => {
            if (count === 0) throw new Error("Couldn't delete bot command")

            res.json(
              new BaseMessage(
                {
                  id: parseInt(req.query.id.toString()),
                },
                'commands:destroy'
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

        const obj: PartialModelObject<BotCommand> = {}

        if (typeof req.body.code === 'string') obj.code = req.body.code
        if (typeof req.body.name === 'string') obj.name = req.body.name

        if (Object.keys(obj).length === 0) {
          throw new Error('No data was set to update')
        }

        fetchCommand(
          BotCommand.query().patchAndFetchById(
            parseInt(req.query.id.toString()),
            obj
          )
        )
          .then((data) => {
            res.json(new BaseMessage(data, 'command:update'))
          })
          .catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
    get: sendCachedResponse(async (req, res) => {
      if (!res.locals.auth && !res.locals.auth.user)
        throw new HttpUnauthorizedError('User is not authenticated')

      const command = await fetchCommand(
        BotCommand.query().findById(parseInt(req.query.id.toString()))
      )
      return new BaseMessage(command, 'commands:get')
    }),
    list: sendCachedResponse(async (req, res) => {
      if (!res.locals.auth && !res.locals.auth.user)
        throw new HttpUnauthorizedError('User is not authenticated')

      const offset = getInt((req.query.offset || '0').toString())
      const pageSize = getInt((req.query.count || '0').toString())

      const send = async (results: BotCommand[], total: number) => {
        const list = await Promise.all(
          results.map(({ id }) => fetchCommand(BotCommand.query().findById(id)))
        )
        return new BaseMessage(
          {
            list,
            total,
            pageSize,
            offset,
          },
          'commands:list'
        )
      }

      const query = BotCommand.query()
        .where('botId', parseInt(req.query.botId.toString()))
        .select('id')
      if (pageSize > 0) {
        const cache = await createPageQueryCache(
          BotCommand,
          query.page(offset, pageSize),
          'commands'
        ).read()
        return await send(cache.results, cache.total)
      } else {
        const cache = await createQueryCache(
          BotCommand,
          query,
          'commands'
        ).read()
        return await send(cache, cache.length)
      }
    }),
  }
}
