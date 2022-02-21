import { Client } from 'discord.js'

export interface Command {
  id: string
  code: string
}

export type CommandTable = Record<string, Command>

export interface Configuration {
  discord: {
    token: string
  }
  name: string
  commands: CommandTable
}

export default class Bot {
  readonly config: Configuration
  readonly client: Client

  constructor(config: Configuration) {
    this.config = config
    this.client = new Client({
      intents: [],
    })
  }

  async start() {
    await this.client.login(this.config.discord.token)
  }
}
