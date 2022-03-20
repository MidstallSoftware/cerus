import { Model } from 'objection'
import BotCommand from './bot'
import BotMessage from './botmessage'

export default class BotCall extends Model {
  id!: number
  commandId!: number
  messageId!: number
  command!: BotCommand
  message!: BotMessage
  dateTime!: number
  type!: 'message' | 'command'
  result!: string
  errors!: string
  messages!: string
  callerId!: string
  guildId!: string
  channelId!: string
  failed!: boolean

  static tableName = 'botCalls'

  static relationMappings = {
    command: {
      relation: Model.BelongsToOneRelation,
      modelClass: BotCommand,
      join: {
        from: 'botCalls.commandId',
        to: 'botCommands.id',
      },
    },
    message: {
      relation: Model.BelongsToOneRelation,
      modelClass: BotMessage,
      join: {
        from: 'botCalls.messageId',
        to: 'botMessages.id',
      },
    },
  }
}
