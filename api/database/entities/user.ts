import { Model, Pojo } from 'objection'
import AccessToken from './accesstoken'
import Bot from './bot'

const TIME_COLUMNS = ['created']

export default class User extends Model {
  id!: number
  discordId!: string
  email!: string
  created!: number | string | Date
  accessTokens!: AccessToken[]
  bots!: Bot[]
  customerId!: string
  type!: 'default' | 'admin'

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

  static tableName = 'users'

  static relationMappings = {
    accessTokens: {
      relation: Model.HasManyRelation,
      modelClass: AccessToken,
      join: {
        from: 'users.id',
        to: 'accessTokens.userId',
      },
    },
    bots: {
      relation: Model.HasManyRelation,
      modelClass: Bot,
      join: {
        from: 'users.id',
        to: 'bots.ownerId',
      },
    },
  }
}
