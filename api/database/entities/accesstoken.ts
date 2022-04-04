import { Model, Pojo } from 'objection'
import User from './user'

const TIME_COLUMNS = ['createdAt', 'deletedAt', 'updatedAt']

export default class AccessToken extends Model {
  id!: number
  token!: string
  user!: User
  userId!: number
  deletedAt!: number | string | Date
  createdAt!: number | string | Date
  updatedAt!: number | string | Date

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

  static tableName = 'accessTokens'

  static relationMappings = {
    user: {
      relation: Model.HasOneRelation,
      modelClass: User,
      join: {
        from: 'accessTokens.userId',
        to: 'users.id',
      },
    },
  }
}
