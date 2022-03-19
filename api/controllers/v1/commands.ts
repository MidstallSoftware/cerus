import { utcToZonedTime } from 'date-fns-tz'
import { CellValue, Workbook } from 'exceljs'
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

export default function () {
  return {
    export: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const run = async () => {
          const command = await fetchCommand(
            BotCommand.query().findById(parseInt(req.query.id.toString()))
          )

          if (!command.premium)
            throw new Error('Premium access is required to export analytics')

          const workbook = new Workbook()
          workbook.creator = 'Cerus'
          workbook.created = new Date()

          const sheet = workbook.addWorksheet('Stats', {
            headerFooter: {
              firstHeader: `Cerus Command #${command.id} (${command.botId}) - ${command.name}`,
            },
          })

          sheet.columns = [
            { header: 'ID', key: 'id', width: 10, font: { bold: true } },
            {
              header: 'Caller ID',
              key: 'caller',
              width: 25,
              font: { bold: true },
            },
            {
              header: 'Timestamp',
              key: 'timestamp',
              width: 20,
              style: {
                numFmt: 'yyyy-mm-dd hh:mm:ss',
              },
              font: { bold: true },
            },
          ]

          for (const call of command.calls as APIInteractionCall[]) {
            sheet.addRow({
              id: call.id,
              caller: call.callerId,
              timestamp: call.timestamp,
            })
          }

          const nextRow = sheet.lastRow.number + 1

          sheet.getCell(`A${nextRow}`).value = 'Total Calls'
          sheet.getCell(`A${nextRow}`).style = {
            font: {
              bold: true,
            },
          }
          sheet.getCell(`B${nextRow}`).value = {
            formula: `COUNT(A2:A${nextRow - 2})`,
            result: (command.calls as APIInteractionCall[]).length,
          } as CellValue

          sheet.getCell(`C${nextRow}`).value = 'Cost Per Call'
          sheet.getCell(`C${nextRow}`).style = {
            font: {
              bold: true,
            },
          }
          sheet.getCell(`D${nextRow}`).value = '0.05'
          sheet.getCell(`D${nextRow}`).style = {
            numFmt: '$0.00',
          }

          sheet.getCell(`E${nextRow}`).value = 'Total Cost'
          sheet.getCell(`E${nextRow}`).style = {
            font: {
              bold: true,
            },
          }

          sheet.getCell(`F${nextRow}`).value = {
            formula: `B${nextRow} * D${nextRow}`,
            result: (command.calls as APIInteractionCall[]).length * 0.05,
          } as CellValue
          sheet.getCell(`F${nextRow}`).style = {
            numFmt: '$0.00',
          }

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
            created: utcToZonedTime(Date.now(), 'Etc/UTC').getTime(),
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
        BotCommand.query()
          .deleteById(id)
          .whereIn(
            'botId',
            Bot.query().select('bots.id').where('ownerId', user.id)
          )
          .then(async (count) => {
            if (count === 0) throw new Error("Couldn't delete bot command")

            await BotCall.query().where('commandId', id).delete()

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

        const id = parseInt(req.query.id.toString())
        const user: User = res.locals.auth.user
        const obj: PartialModelObject<BotCommand> = {}

        if (typeof req.body.code === 'string') obj.code = req.body.code
        if (typeof req.body.name === 'string') obj.name = req.body.name

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
