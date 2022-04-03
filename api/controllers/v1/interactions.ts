import { ClientEvents } from 'discord.js'
import { NextFunction, Request, Response } from 'express'
import { PartialModelObject } from 'objection'
import Bot from '../../database/entities/bot'
import BotCall from '../../database/entities/botcall'
import BotInteraction from '../../database/entities/botinteraction'
import User from '../../database/entities/user'
import { exportCalls } from '../../lib/call'
import { fetchInteraction, transformInteraction } from '../../lib/interaction'
import { HttpUnauthorizedError } from '../../exceptions'
import { BaseMessage } from '../../message'
import {
  createPageQueryCache,
  createQueryCache,
  createSingleQueryCache,
  getInt,
  sendCachedResponse,
} from '../../utils'

export default function () {
  return {
    export: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const user: User = res.locals.auth.user

        const run = async () => {
          const inter = await fetchInteraction(
            BotInteraction.query()
              .findById(parseInt(req.query.id.toString()))
              .whereIn(
                'botId',
                Bot.query().select('bots.id').where('ownerId', user.id)
              )
          )

          const workbook = exportCalls(inter.calls, {
            headerFooter: {
              firstFooter: `Cerus Command #${inter.id} (${inter.botId}) - ${inter.type}`,
            },
          })

          res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          )
          res.setHeader(
            'Content-Disposition',
            `attachment; filename=cerus-${inter.botId}-${inter.id}.xlsx`
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
          const type = req.query.type.toString() as keyof ClientEvents

          const bot = await createSingleQueryCache(
            Bot,
            Bot.query().findById(botId)
          ).read()

          if (bot.premium === 0)
            throw new Error('A premium bot is required for interaction hooks')

          const similarCount = (
            (
              await createQueryCache(
                BotInteraction,
                BotInteraction.query()
                  .where('botId', botId)
                  .where('type', type)
                  .count()
              ).read()
            )[0] as any
          )['count(`id`)'] as number

          if (similarCount > 0)
            throw new Error('Cannot create another hook for this type')

          const inter = await BotInteraction.query().insertGraphAndFetch({
            botId,
            type,
            created: new Date(new Date().toUTCString()),
          })

          res.json(
            new BaseMessage(transformInteraction(inter), 'interactions:create')
          )
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
          await BotCall.query().where('interactionId', id).delete()

          const count = await BotInteraction.query()
            .deleteById(id)
            .whereIn(
              'botId',
              Bot.query().select('bots.id').where('ownerId', user.id)
            )

          if (count === 0) throw new Error("Couldn't delete bot interaction")

          res.json(
            new BaseMessage(
              {
                id,
              },
              'interactions:destroy'
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
        const obj: PartialModelObject<BotInteraction> = {}

        if (typeof req.body.code === 'string') obj.code = req.body.code

        if (Object.keys(obj).length === 0) {
          throw new Error('No data was set to update')
        }

        fetchInteraction(
          BotInteraction.query()
            .patchAndFetchById(id, obj)
            .whereIn(
              'botId',
              Bot.query().select('bots.id').where('ownerId', user.id)
            )
        )
          .then((data) => {
            res.json(new BaseMessage(data, 'interactions:update'))
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
      const inter = await fetchInteraction(
        BotInteraction.query()
          .findById(parseInt(req.query.id.toString()))
          .whereIn(
            'botId',
            Bot.query().select('bots.id').where('ownerId', user.id)
          )
      )
      return new BaseMessage(inter, 'interactions:get')
    }),
    list: sendCachedResponse(async (req, res) => {
      if (!res.locals.auth && !res.locals.auth.user)
        throw new HttpUnauthorizedError('User is not authenticated')

      const offset = getInt((req.query.offset || '0').toString())
      const pageSize = getInt((req.query.count || '0').toString())
      const user: User = res.locals.auth.user

      const send = async (results: BotInteraction[], total: number) => {
        const list = await Promise.all(
          results.map(({ id }) =>
            fetchInteraction(BotInteraction.query().findById(id))
          )
        )
        return new BaseMessage(
          {
            list,
            total,
            pageSize,
            offset,
          },
          'interactions:list'
        )
      }

      const query = BotInteraction.query()
        .where('botId', parseInt(req.query.botId.toString()))
        .whereIn(
          'botId',
          Bot.query().select('bots.id').where('ownerId', user.id)
        )
        .select('id')
      if (pageSize > 0) {
        const cache = await createPageQueryCache(
          BotInteraction,
          query.page(offset, pageSize),
          'interactions'
        ).read()
        return await send(cache.results, cache.total)
      } else {
        const cache = await createQueryCache(
          BotInteraction,
          query,
          'interactions'
        ).read()
        return await send(cache, cache.length)
      }
    }),
  }
}
