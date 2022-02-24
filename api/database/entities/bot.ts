import { Model } from 'objection'
import BotCommand from './botcommand'

export default class Bot extends Model {
  id!: number
  name!: string
  ownerId!: number
  commands!: BotCommand[]

  static tableName = 'bots'

  static relationMappings = {
    commands: {
      relation: Model.BelongsToOneRelation,
      modelClass: BotCommand,
      join: {
        from: 'bots.id',
        to: 'botCommands.botId',
      },
    },
  }
}
