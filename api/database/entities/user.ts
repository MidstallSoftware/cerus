import { Model } from 'objection'
import AccessToken from './accesstoken'
import Bot from './bot'

export default class User extends Model {
  id!: number
  discordId!: string
  email!: string
  created!: number
  accessTokens!: AccessToken[]
  bots!: Bot[]
  type!: 'default' | 'admin'

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
