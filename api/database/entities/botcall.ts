import { Model, Pojo } from 'objection'

const TIME_COLUMNS = ['dateTime']

export default class BotCall extends Model {
  id!: number
  commandId!: number
  messageId!: number
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
}
