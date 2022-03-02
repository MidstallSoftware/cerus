import User from '../../database/entities/user'
import { BaseMessage } from '../../message'
import { sendCachedResponse } from '../../utils'

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
          created: (() => {
            const d = new Date()
            d.setTime(user.created)
            return d
          })(),
        },
        'user:info'
      )
    }),
  }
}
