import { NextFunction, Request, Response } from 'express'
import { PartialModelObject } from 'objection'
import { HttpUnauthorizedError } from '../../exceptions'
import BotCall from '../../database/entities/botcall'
import BotCommand from '../../database/entities/botcommand'
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
import { fetchCommand, transformCommand } from '../../lib/command'
import { APIInteractionCall } from '../../types'
import { exportCalls } from '../../lib/call'

export default function () {
  return {
    export: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const user: User = res.locals.auth.user

        const run = async () => {
          const command = await fetchCommand(
            BotCommand.query()
              .findById(parseInt(req.query.id.toString()))
              .whereIn(
                'botId',
                Bot.query().select('bots.id').where('ownerId', user.id)
              )
          )

          if (!command.premium)
            throw new Error('Premium access is required to export analytics')

          const workbook = exportCalls(command.calls as APIInteractionCall[], {
            headerFooter: {
              firstFooter: `Cerus Command #${command.id} (${command.botId}) - ${command.name}`,
            },
          })

          res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          )
          res.setHeader(
            'Content-Disposition',
            `attachment; filename=cerus-${command.botId}-${command.id}.xlsx`
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
          const name = req.query.name.toString()
          const user: User = res.locals.auth.user
          const bot = await createSingleQueryCache(
            Bot,
            Bot.query().findById(botId).where('ownerId', user.id)
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
            options: '[]',
            created: new Date(new Date().toUTCString()),
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

        const user: User = res.locals.auth.user
        const id = parseInt(req.query.id.toString())

        const run = async () => {
          await BotCall.query().where('commandId', id).delete()

          const count = await BotCommand.query()
            .deleteById(id)
            .whereIn(
              'botId',
              Bot.query().select('bots.id').where('ownerId', user.id)
            )

          if (count === 0) throw new Error("Couldn't delete bot command")

          res.json(
            new BaseMessage(
              {
                id,
              },
              'commands:destroy'
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
        const obj: PartialModelObject<BotCommand> = {}

        if (typeof req.body.description === 'string')
          obj.description = req.body.description
        if (typeof req.body.code === 'string') obj.code = req.body.code
        if (typeof req.body.name === 'string') obj.name = req.body.name
        if (
          typeof req.body.options === 'object' &&
          Array.isArray(req.body.options)
        )
          obj.options = JSON.stringify(req.body.options)

        if (Object.keys(obj).length === 0) {
          throw new Error('No data was set to update')
        }

        fetchCommand(
          BotCommand.query()
            .patchAndFetchById(id, obj)
            .whereIn(
              'botId',
              Bot.query()
                .select('bots.id')
                .where('ownerId', user.id)
                .where('bots.id', id)
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

      const user: User = res.locals.auth.user
      const id = parseInt(req.query.id.toString())
      const command = await fetchCommand(
        BotCommand.query()
          .findById(id)
          .whereIn(
            'botId',
            Bot.query()
              .select('bots.id')
              .joinRelated('commands')
              .where('bots.ownerId', user.id)
          )
      )
      return new BaseMessage(command, 'commands:get')
    }),
    list: sendCachedResponse(async (req, res) => {
      if (!res.locals.auth && !res.locals.auth.user)
        throw new HttpUnauthorizedError('User is not authenticated')

      const offset = getInt((req.query.offset || '0').toString())
      const pageSize = getInt((req.query.count || '0').toString())
      const botId = parseInt(req.query.botId.toString())
      const user: User = res.locals.auth.user

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
        .where('botId', botId)
        .whereIn(
          'botId',
          Bot.query()
            .select('bots.id')
            .joinRelated('commands')
            .where('bots.ownerId', user.id)
        )
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
