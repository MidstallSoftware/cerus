import { APIUser } from 'discord-api-types/v9'
import { Model, Pojo } from 'objection'
import fetch from 'node-fetch'
import BotCommand from './botcommand'
import BotMessage from './botmessage'
import User from './user'
import BotInteraction from './botinteraction'

const TIME_COLUMNS = ['createdAt', 'updatedAt', 'deletedAt']

export default class Bot extends Model {
  id!: number
  createdAt!: number | string | Date
  updatedAt!: number | string | Date
  deletedAt!: number | string | Date
  ownerId!: number
  owner!: User
  discordId!: string
  token!: string
  premium!: number
  commands!: BotCommand[]
  messages!: BotMessage[]
  interactions!: BotInteraction[]
  running!: boolean
  intents!: string[]

  $parseDatabaseJson(json: Pojo) {
    json = super.$parseDatabaseJson(json)
    TIME_COLUMNS.forEach((key) => {
      if (!(json[key] instanceof Date)) {
        json[key] = new Date(json[key])
      }
    })

    if (!Array.isArray(json.intents) && typeof json.intents === 'string')
      json.intents = JSON.parse(json.intents)
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

    if (Array.isArray(json.intents)) json.intents = JSON.stringify(json.intents)
    return json
  }

  async fetch(): Promise<APIUser> {
    const resp = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bot ${this.token}`,
      },
    })
    return (await resp.json()) as APIUser
  }

  async getAvatar(): Promise<string> {
    return (await this.fetch()).avatar
  }

  static tableName = 'bots'

  static relationMappings = {
    commands: {
      relation: Model.HasManyRelation,
      modelClass: BotCommand,
      join: {
        from: 'bots.id',
        to: 'botCommands.botId',
      },
    },
    messages: {
      relation: Model.HasManyRelation,
      modelClass: BotMessage,
      join: {
        from: 'bots.id',
        to: 'botCommands.botId',
      },
    },
    interactions: {
      relation: Model.HasManyRelation,
      modelClass: BotInteraction,
      join: {
        from: 'bots.id',
        to: 'botInteractions.botId',
      },
    },
    owner: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'bots.ownerId',
        to: 'users.id',
      },
    },
  }
}
