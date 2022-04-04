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
          })

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
