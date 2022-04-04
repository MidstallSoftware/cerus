import { Model, Pojo } from 'objection'
import Bot from './bot'

const TIME_COLUMNS = ['createdAt', 'updatedAt', 'deletedAt']

export default class BotDataStore extends Model {
  id!: number
  botId!: number
  bot!: Bot
  key!: string
  value!: string
  createdAt!: number | string | Date
  updatedAt!: number | string | Date
  deletedAt!: number | string | Date

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

  static tableName = 'botDataStores'

  static relationMappings = {
    bot: {
      relation: Model.BelongsToOneRelation,
      modelClass: Bot,
      join: {
        from: 'botDataStores.botId',
        to: 'bots.id',
      },
    },
  }
}
