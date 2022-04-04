import { Model, Pojo } from 'objection'
import Bot from './bot'
import BotCall from './botcall'

const TIME_COLUMNS = ['createdAt', 'updatedAt', 'deletedAt']

export default class BotCommand extends Model {
  id!: number
  name!: string
  code!: string
  botId!: number
  premium!: number
  bot!: Bot
  createdAt!: number | string | Date
  updatedAt!: number | string | Date
  deletedAt!: number | string | Date
  calls!: BotCall[]
  options: string
  description!: string

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
