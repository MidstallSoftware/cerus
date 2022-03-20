import { Model } from 'objection'
import Bot from './bot'
import BotCall from './botcall'

export default class BotCommand extends Model {
  id!: number
  name!: string
  code!: string
  botId!: number
  premium!: number
  bot!: Bot
  created!: number
  calls!: BotCall[]
  options: string
  description!: string

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
    calls: {
      relation: Model.HasManyRelation,
      modelClass: BotCall,
      join: {
        from: 'botCommands.id',
        to: 'botCalls.commandId',
      },
    },
  }
}
