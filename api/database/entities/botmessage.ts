import { Model, Pojo } from 'objection'
import Bot from './bot'
import BotCall from './botcall'

const TIME_COLUMNS = ['createdAt', 'updatedAt', 'deletedAt']

export default class BotMessage extends Model {
  id!: number
  regex!: string
  code!: string
  botId!: number
  createdAt!: number | string | Date
  updatedAt!: number | string | Date
  deletedAt!: number | string | Date
  bot!: Bot
  calls!: BotCall[]

  $parseDatabaseJson(json: Pojo) {
    json = super.$parseDatabaseJson(json)
    TIME_COLUMNS.forEach((key) => {
      if (!(json[key] instanceof Date)) {
        json[key] = new Date(json[key])
      }
    })
    return json
  }

  $formatDatabaseJson(json: Pojo) {
    json = super.$formatDatabaseJson(json)
    TIME_COLUMNS.forEach((key) => {
      if (json[key] instanceof Date) {
        json[key] = (json[key] as Date)
          .toISOString()
          .replace('T', ' ')
          .replace('Z', '')
      }
    })
    return json
  }

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
