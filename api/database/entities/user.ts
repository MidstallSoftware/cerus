import { Model } from 'objection'
import AccessToken from './accesstoken'
import Bot from './bot'

export default class User extends Model {
  id!: number
  discordId!: string
  created!: Date
  accessTokens!: AccessToken[]
  bots!: Bot[]

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
