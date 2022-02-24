import { Model } from 'objection'
import BotCommand from './bot'

export default class CommandCall extends Model {
  id!: number
  command!: BotCommand
  dateTime!: Date

  static tableName = 'commandCalls'

  static relationMappings = {
    command: {
      relation: Model.BelongsToOneRelation,
      modelClass: BotCommand,
      join: {
        from: 'commandCalls.id',
        to: 'botCommands.commandId',
      },
    },
  }
}
