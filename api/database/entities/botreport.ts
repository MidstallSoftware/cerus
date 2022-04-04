import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { Model, Pojo } from 'objection'
import { blobFromSync } from 'fetch-blob/from'
import { APIReportType } from '../../types'
import User from './user'
import Bot from './bot'

const TIME_COLUMNS = ['createdAt', 'updatedAt', 'deletedAt']

export default class BotReport extends Model {
  id!: number
  bot!: Bot
  botId!: number
  user!: User
  userId!: number
  title!: string
  content!: string
  type!: APIReportType
  createdAt!: number | string | Date
  updatedAt!: number | string | Date
  deletedAt!: number | string | Date
  resolved!: boolean

  get attachments(): Record<string, Blob> {
    const p = join(
      process.env.CERUS_STORAGE_DIR || '/var/lib/cerus-bots',
      'reportAttachments',
      this.id.toString()
    )
    if (existsSync(p)) {
      const att: Record<string, Blob> = {}
      for (const fname in readdirSync(p)) {
        att[fname] = blobFromSync(join(p, fname))
      }
      return att
    }
    return {}
  }

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

  static tableName = 'botReports'

  static relationMappings = {
    user: {
      relation: Model.HasOneRelation,
      modelClass: User,
      join: {
        from: 'botReports.userId',
        to: 'users.id',
      },
    },
    bot: {
      relation: Model.HasOneRelation,
      modelClass: Bot,
      join: {
        from: 'botReports.botId',
        to: 'bots.id',
      },
    },
  }
}
