import { Model, Pojo } from 'objection'
import BotCommand from './bot'
import BotMessage from './botmessage'

const TIME_COLUMNS = ['dateTime']

export default class BotCall extends Model {
  id!: number
  commandId!: number
  messageId!: number
  command!: BotCommand
  message!: BotMessage
  dateTime!: number | string | Date
  type!: 'message' | 'command'
  result!: string
  errors!: string
  messages!: string
  callerId!: string
  guildId!: string
  channelId!: string
  failed!: boolean

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
