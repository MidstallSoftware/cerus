import { APIUser } from 'discord-api-types/v9'
import { Client } from 'discord.js'
import { Model } from 'objection'
import BotCommand from './botcommand'
import BotMessage from './botmessage'
import User from './user'

export default class Bot extends Model {
  id!: number
  name!: string
  created!: number
  ownerId!: number
  owner!: User
  discordId!: string
  token!: string
  premium!: number
  commands!: BotCommand[]
  messages!: BotMessage[]

  fetch(): Promise<APIUser> {
    return new Promise((resolve, reject) => {
      const client = new Client({
        intents: [],
      })

      client.on('ready', () => {
        resolve({
          id: client.user.id,
          username: client.user.username,
          discriminator: client.user.discriminator,
          avatar: client.user.avatar,
          bot: client.user.bot,
          system: client.user.system,
          mfa_enabled: client.user.mfaEnabled,
          banner: client.user.banner,
          accent_color: client.user.accentColor,
        })
        client.destroy()
      })

      client.login(this.token).catch(reject)
    })
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
