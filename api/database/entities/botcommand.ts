import { Model } from 'objection'
import Bot from './bot'

export default class BotCommand extends Model {
  id!: number
  name!: string
  code!: string
  botId!: number
  bot!: Bot
  premium!: boolean

  static tableName = 'botCommands'

  static relationMappings = {
    bot: {
      relation: Model.BelongsToOneRelation,
      modelClass: Bot,
      join: {
        from: 'botCommands.botId',
        to: 'bots.id',
      },
    },
  }
}
