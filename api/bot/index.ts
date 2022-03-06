import { Client, CommandInteraction, Message } from 'discord.js'
import Bot from '../database/entities/bot'
import BotCall from '../database/entities/botcall'
import winston from '../providers/winston'
import { defineContext } from './context'

type MessageHook = (msg: Message) => any
type CommandHook = (msg: CommandInteraction) => any

export default class BotInstance {
  readonly entry: Bot
  readonly client: Client

  constructor(botEntry: Bot) {
    this.entry = botEntry
    this.client = new Client({
      intents: [],
    })

    this.client.on('messageCreate', (msg) => {
      if (this.entry.premium) {
        const hooks = this.entry.messages.filter((hook) =>
          new RegExp(hook.regex).test(msg.content)
        )
        for (const hook of hooks) {
          let messages = ''
          let errors = ''
          defineContext(this, hook.code, {
            premium: true,
            type: 'message',
            print(...args: any[]) {
              messages += args.map((v) => v.toString()).join('\t') + '\n'
            },
          })
            .then((runner: MessageHook) => {
              let result: any
              try {
                result = runner(msg)
              } catch (e) {
                errors += e.toString() + '\n'
              } finally {
                BotCall.query().insert({
                  messageId: hook.id,
                  type: 'message',
                  dateTime: new Date(),
                  result: JSON.stringify(result),
                  errors,
                  messages,
                })
              }
            })
            .catch((e) => winston.error(e))
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

        let messages = ''
        let errors = ''

        defineContext(this, cmd.code, {
          premium: cmd.premium === 1,
          type: 'command',
          print(...args: any[]) {
            messages += args.map((v) => v.toString()).join('\t') + '\n'
          },
        })
          .then((runner: CommandHook) => {
            let result: any
            try {
              result = runner(inter)
            } catch (e) {
              errors += e.toString() + '\n'
            } finally {
              BotCall.query().insert({
                commandId: cmd.id,
                type: 'command',
                dateTime: new Date(),
                result: JSON.stringify(result),
                errors,
                messages,
              })
            }
          })
          .catch((e) => winston.error(e))
      }
    })
  }

  async init() {
    return await this.client.login(this.entry.token)
  }
}
