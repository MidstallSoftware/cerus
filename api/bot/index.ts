import { Client, CommandInteraction, Intents, MessageEmbed } from 'discord.js'
import { REST } from '@discordjs/rest'
import { codeBlock, SlashCommandBuilder } from '@discordjs/builders'
import { Routes } from 'discord-api-types/v9'
import Bot from '../database/entities/bot'
import BotCall from '../database/entities/botcall'
import winston from '../providers/winston'
import { DI } from '../di'
import { defineContext } from './context'

export default class BotInstance {
  readonly entry: Bot
  readonly client: Client

  constructor(botEntry: Bot) {
    this.entry = botEntry
    this.client = new Client({
      intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS],
    })

    this.client.on('messageCreate', (msg) => {
      if (this.entry.premium === 1) {
        const hooks = this.entry.messages.filter((hook) =>
          new RegExp(hook.regex).test(msg.content)
        )
        for (const hook of hooks) {
          let messages = ''
          let errors = ''
          let results = ''
          defineContext(this, hook.code, {
            premium: true,
            type: 'message',
            globals: {
              message: msg,
            },
            print(...args: any[]) {
              messages += args.map((v) => v.toString()).join('\t') + '\n'
            },
          })
            .then(async (result) => {
              results = JSON.stringify(result)
              await BotCall.query().insert({
                messageId: hook.id,
                type: 'message',
                dateTime: new Date(),
                result: results,
                errors,
                messages,
              })
            })
            .catch((e) => {
              errors += e.toString() + '\n'
              winston.error(e)
              msg.reply({
                embeds: [
                  new MessageEmbed()
                    .setTitle(
                      `${this.entry.name} - ${hook.regex}: Failed to run`
                    )
                    .setColor('RED')
                    .setDescription(
                      `Failed to run interaction:\n${codeBlock(e.message)}`
                    ),
                ],
              })
            })
        }
      }
    })

    this.client.on('guildCreate', (guild) => {
      this.setCommands(guild.id)
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
        let results = ''

        defineContext(this, cmd.code, {
          premium: cmd.premium === 1,
          type: 'command',
          globals: {
            interaction: inter,
          },
          print(...args: any[]) {
            messages += args.map((v) => v.toString()).join('\t') + '\n'
          },
        })
          .then(async (result) => {
            results = JSON.stringify(result)
            await BotCall.query().insert({
              commandId: cmd.id,
              type: 'command',
              dateTime: new Date(),
              result: results,
              errors,
              messages,
            })
            await DI.stripe.subscriptionItems.createUsageRecord(
              'cerus_prem_command',
              {
                quantity: 1,
                timestamp: Date.now() / 1000,
                action: 'increment',
              }
            )
          })
          .catch((e) => {
            errors += e.toString() + '\n'
            winston.error(e)
            inter.reply({
              embeds: [
                new MessageEmbed()
                  .setTitle(`${this.entry.name} - ${cmd.name}: Failed to run`)
                  .setColor('RED')
                  .setDescription(
                    `Failed to run interaction:\n${codeBlock(e.message)}`
                  ),
              ],
            })
          })
      }
    })
  }

  private setCommands(guild: string) {
    const cmds = this.entry.commands.map((cmd) =>
      new SlashCommandBuilder()
        .setName(cmd.name)
        .setDescription('Undescribed')
        .toJSON()
    )
    const rest = new REST({ version: '9' }).setToken(this.entry.token)
    winston.debug(`Registering commands for ${guild}`)
    return rest.put(
      Routes.applicationGuildCommands(this.entry.discordId, guild),
      { body: cmds }
    )
  }

  async updateCommands() {
    return Promise.all(
      (await this.client.guilds.fetch()).map((g) => this.setCommands(g.id))
    )
  }

  stop() {
    this.client.destroy()
  }

  async init() {
    await this.client.login(this.entry.token)
    this.client.user.setActivity('Hosted by Cerus', { type: 'STREAMING' })
    await this.updateCommands()
  }
}
