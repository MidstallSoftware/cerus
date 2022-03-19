import { Model } from 'objection'
import Bot from './bot'

export default class BotDataStore extends Model {
  id!: number
  botId!: number
  bot!: Bot
  key!: string
  value!: string
  created!: number
  updated!: number

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
