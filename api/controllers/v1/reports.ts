import { join } from 'path'
import { createHash } from 'crypto'
import { writeFileSync } from 'fs'
import { sync as mkdirpSync } from 'mkdirp'
import { NextFunction, Response, Request } from 'express'
import { format } from 'date-fns'
import { transformReport } from '../../lib/report'
import { DI } from '../../di'
import { BaseMessage } from '../../message'
import { APIReportType } from '../../types'
import { createSingleQueryCache, fixDate } from '../../utils'
import Bot from '../../database/entities/bot'
import BotReport from '../../database/entities/botreport'
import User from '../../database/entities/user'
import winston from '../../providers/winston'
import { HttpUnauthorizedError } from '../../exceptions'

export default function () {
  return {
    create: (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const user: User = res.locals.auth.user

        const run = async () => {
          const bot = await createSingleQueryCache(
            Bot,
            Bot.query().findOne({
              discordId: req.query.botId.toString(),
            })
          ).read()

          const botOwner = await createSingleQueryCache(
            User,
            User.query().findById(bot.ownerId)
          ).read()
          const fetched = await bot.fetch()

          const { title, content, type } = req.query
          const report = await BotReport.query().insertGraphAndFetch({
            userId: user.id,
            botId: bot.id,
            type: type as APIReportType,
            title: title.toString(),
            content: content.toString(),
            createdAt: new Date(new Date().toUTCString()),
          })

          mkdirpSync(report.attachmentsPath)

          try {
            const value = req.files.files
            if (Array.isArray(value)) {
              for (const v of value) {
                const s = v.name.lastIndexOf('.')
                const ext = v.name.substring(s + 1)
                const hash = createHash('sha256')
                  .update(v.data)
                  .digest('hex')
                  .substring(0, 15)
                const fname = `${hash}.${ext}`
                writeFileSync(join(report.attachmentsPath, fname), v.data)
              }
            } else {
              const s = value.name.lastIndexOf('.')
              const ext = value.name.substring(s + 1)
              const hash = createHash('sha256')
                .update(value.data)
                .digest('hex')
                .substring(0, 15)
              const fname = `${hash}.${ext}`
              writeFileSync(join(report.attachmentsPath, fname), value.data)
            }
          } catch (e) {
            report.$query().delete()
            throw e
          }

          setImmediate(async () => {
            const admins = await User.query().where('type', 'admin')
            for (const admin of admins) {
              try {
                await DI.mail.send(
                  admin.email,
                  `Reported Bot ${fetched.username} - ${report.type}: ${report.title}`,
                  'admin-report',
                  {
                    botName: fetched.username,
                    botId: bot.id,
                    botOwnerId: botOwner.id,
                    type: report.type,
                    time: format(fixDate(report.createdAt), 'yyyy-MM-dd ppp'),
                    title: report.title,
                    content: report.content,
                  }
                )
              } catch (e) {
                winston.error(e)
              }
            }
          })

          res.json(new BaseMessage(transformReport(report), 'reports:create'))
        }

        run().catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
  }
}
