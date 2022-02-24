import { Model } from 'objection'
import User from './user'

export default class AccessToken extends Model {
  id!: number
  token!: string
  user!: User
  userId!: number

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
