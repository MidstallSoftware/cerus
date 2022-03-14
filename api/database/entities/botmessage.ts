import { Model } from 'objection'
import Bot from './bot'
import BotCall from './botcall'

export default class BotMessage extends Model {
  id!: number
  regex!: string
  code!: string
  botId!: number
  created!: number
  bot!: Bot
  calls!: BotCall[]

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
    calls: {
      relation: Model.HasManyRelation,
      modelClass: BotCall,
      join: {
        from: 'botMessages.id',
        to: 'botCalls.messageId',
      },
    },
  }
}
