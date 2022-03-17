import ExcelJS from 'exceljs'
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
import BotCall from '../../database/entities/botcall'
import { APICommand, APICommandCall, APICommandCallSummary } from '../../types'

const fixDate = (dt: number) => {
  const d = new Date()
  d.setTime(dt)
  return d
}

const transformCall = (call: BotCall) =>
  ({
    id: call.id,
    result: call.result,
    errors: call.errors,
    message: call.message,
    callerId: call.callerId,
    timestamp: fixDate(call.dateTime),
  } as APICommandCall)

const transformCommand = (cmd: BotCommand) =>
  ({
    id: cmd.id,
    botId: cmd.botId,
    name: cmd.name,
    premium: cmd.premium === 1,
    code: cmd.code,
    calls:
      typeof cmd.calls === 'undefined'
        ? []
        : cmd.premium === 1
        ? cmd.calls.map(transformCall)
        : ({
            thisMonth: cmd.calls.filter(
              (c) => fixDate(c.dateTime).getMonth() === new Date().getMonth()
            ).length,
            thisYear: cmd.calls.filter(
              (c) =>
                fixDate(c.dateTime).getFullYear() === new Date().getFullYear()
            ).length,
            lifetime: cmd.calls.length,
          } as APICommandCallSummary),
    created: fixDate(cmd.created),
  } as APICommand)

const fetchCommand = async (query: QueryBuilder<BotCommand, BotCommand>) => {
  const value = await createSingleQueryCache(
    BotCommand,
    query.withGraphFetched('calls')
  ).read()
  return transformCommand(value)
}

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

          const workbook = new ExcelJS.Workbook()
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

          for (const call of command.calls as APICommandCall[]) {
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
            result: (command.calls as APICommandCall[]).length,
          } as ExcelJS.CellValue

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
            result: (command.calls as APICommandCall[]).length * 0.05,
          } as ExcelJS.CellValue
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
