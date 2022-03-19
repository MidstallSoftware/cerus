import { Request, Response, NextFunction } from 'express'
import AccessToken from '../../database/entities/accesstoken'
import Bot from '../../database/entities/bot'
import BotCall from '../../database/entities/botcall'
import BotCommand from '../../database/entities/botcommand'
import BotDataStore from '../../database/entities/botdatastore'
import BotMessage from '../../database/entities/botmessage'
import User from '../../database/entities/user'
import { DI } from '../../di'
import { HttpUnauthorizedError } from '../../exceptions'
import { BaseMessage } from '../../message'
import { fixDate, sendCachedResponse } from '../../utils'

export default function () {
  return {
    info: sendCachedResponse((_req, res) => {
      const user: User = res.locals.auth.user
      return new BaseMessage(
        {
          id: user.id,
          email: user.email,
          discordid: user.discordId,
          type: user.type,
          created: fixDate(user.created),
        },
        'user:info'
      )
    }),
    delete: (_req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const user: User = res.locals.auth.user

        const run = async () => {
          const bots = await Bot.query().where('ownerId', user.id)

          for (const bot of bots) {
            const cmds = await BotCommand.query().where('botId', bot.id)
            for (const cmd of cmds) {
              await BotCall.query().select('commandId', cmd.id).delete()
              await cmd.$query().delete()
            }

            const msgs = await BotMessage.query().where('botId', bot.id)
            for (const msg of msgs) {
              await BotCall.query().select('messageId', msg.id).delete()
              await msg.$query().delete()
            }

            await BotDataStore.query().where('botId', bot.id).delete()
            await bot.$query().delete()
          }

          await Promise.all(
            (
              await DI.stripe.subscriptions.list({
                customer: user.customerId,
              })
            ).data.map(async (sub) => await DI.stripe.subscriptions.del(sub.id))
          )

          await DI.stripe.customers.del(user.customerId)

          await AccessToken.query().where('userId', user.id).delete()
          await User.query().where('id', user.id).delete()

          res.json(new BaseMessage({ id: user.id }, 'user:delete'))
        }

        run().catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
  }
}
