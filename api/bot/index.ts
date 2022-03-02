import { Client, CommandInteraction, Message } from 'discord.js'
import Bot from '../database/entities/bot'
import { defineContext } from './context'

type MessageHook = (msg: Message) => {}
type CommandHook = (msg: CommandInteraction) => {}

export default class BotInstance {
  readonly entry: Bot
  readonly client: Client

  constructor(botEntry: Bot) {
    this.entry = botEntry
    this.client = new Client({
      intents: [],
    })

    this.client.on('messageCreate', (msg) => {
      if (this.entry.premuim) {
        const hooks = this.entry.messages.filter((hook) =>
          new RegExp(hook.regex).test(msg.content)
        )
        for (const hook of hooks) {
          defineContext(this, hook.code, {
            premium: true,
            type: 'message',
          })
            .then((runner: MessageHook) => {
              runner(msg)
            })
            .catch(() => {})
        }
      }
    })

    this.client.on('interactionCreate', (interaction) => {
      if (interaction.isCommand()) {
        const inter = interaction as CommandInteraction
        const cmd = this.entry.commands.find(
          (c) => c.name === inter.commandName
        )
        if (cmd === null) return

        defineContext(this, cmd.code, {
          premium: cmd.premium,
          type: 'command',
        })
          .then((runner: CommandHook) => {
            runner(inter)
          })
          .catch(() => {})
      }
    })
  }

  async init() {
    return await this.client.login(this.entry.token)
  }
}
