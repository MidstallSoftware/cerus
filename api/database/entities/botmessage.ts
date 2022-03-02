import { Model } from 'objection'
import Bot from './bot'

export default class BotMessage extends Model {
  id!: number
  regex!: string
  code!: string
  botId!: number
  bot!: Bot

  static tableName = 'botMessages'

  static relationMappings = {
    bot: {
      relation: Model.BelongsToOneRelation,
      modelClass: Bot,
      join: {
        from: 'botMessages.botId',
        to: 'bots.id',
      },
    },
  }
}
