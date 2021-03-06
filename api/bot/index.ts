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
      intents: Object.keys(Intents.FLAGS)
        .filter((v) => this.entry.intents.includes(v))
        .map((v) => (Intents.FLAGS as Record<string, number>)[v]),
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
          let failed = false
          this.entry
            .fetch()
            .then((discordUser) =>
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
                .then((result) => {
                  results = JSON.stringify(result)
                })
                .catch((e) => {
                  failed = true
                  errors += e.toString() + '\n'
                  winston.error(e)
                  msg.reply({
                    embeds: [
                      new MessageEmbed()
                        .setTitle(
                          `${this.client.user.username} - ${hook.regex}: Failed to run`
                        )
                        .setColor('RED')
                        .setDescription(
                          `Failed to run interaction:\n${codeBlock(e.message)}`
                        ),
                    ],
                  })
                  DI.mail
                    .send(
                      this.entry.owner.email,
                      `Message Hook Failure: Cerus - ${discordUser.username} - ${hook.regex}`,
                      'failure',
                      {
                        type: 'message',
                        objectName: hook.regex,
                        botName: discordUser.username,
                        botId: this.entry.id,
                        objectId: hook.id,
                        error: e,
                        messages,
                      }
                    )
                    .catch((e) => winston.error(e))
                })
                .finally(() =>
                  setImmediate(async () => {
                    winston.debug('Adding bot call')
                    try {
                      await BotCall.query().insert({
                        messageId: hook.id,
                        type: 'message',
                        channelId: msg.channelId,
                        guildId: msg.guildId,
                        failed,
                        createdAt: new Date(new Date().toUTCString()),
                        callerId: msg.member.id,
                        result: results,
                        errors,
                        messages,
                      })
                    } catch (e) {
                      winston.error(e)
                    }
                  })
                )
            )
            .catch((e) => winston.error(e))
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
        let failed = false

        this.entry
          .fetch()
          .then((discordUser) =>
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
                if (cmd.premium === 1) {
                  const subs = await DI.stripe.subscriptions.list({
                    customer: this.entry.owner.customerId,
                  })
                  const sub = subs.data.find(
                    (s) =>
                      s.items.data[0].price.metadata.type === 'command' &&
                      s.items.data[0].price.metadata.id ===
                        this.entry.id.toString()
                  )
                  await DI.stripe.subscriptionItems.createUsageRecord(
                    sub.items.data[0].id,
                    {
                      quantity: 1,
                      timestamp: 'now',
                      action: 'increment',
                    }
                  )
                }
              })
              .catch((e) => {
                failed = true
                errors += e.toString() + '\n'
                winston.error(e)
                const r = {
                  embeds: [
                    new MessageEmbed()
                      .setTitle(
                        `${this.client.user.username} - ${cmd.name}: Failed to run`
                      )
                      .setColor('RED')
                      .setDescription(
                        `Failed to run interaction:\n${codeBlock(e.message)}`
                      ),
                  ],
                }
                if (!inter.replied) inter.reply(r)
                else inter.channel.send(r)

                DI.mail
                  .send(
                    this.entry.owner.email,
                    `Interaction Failure: Cerus - ${discordUser.username} - ${cmd.name}`,
                    'failure',
                    {
                      type: 'command',
                      objectName: cmd.name,
                      botName: discordUser.username,
                      botId: this.entry.id,
                      objectId: cmd.id,
                      error: e,
                      messages,
                    }
                  )
                  .catch((e) => winston.error(e))
              })
              .finally(() =>
                setImmediate(async () => {
                  winston.debug('Adding bot call')
                  try {
                    await BotCall.query().insert({
                      commandId: cmd.id,
                      type: 'command',
                      createdAt: new Date(new Date().toUTCString()),
                      channelId: inter.channelId,
                      guildId: inter.guildId,
                      callerId: inter.member.user.id,
                      result: results,
                      failed,
                      errors,
                      messages,
                    })
                  } catch (e) {
                    winston.error(e)
                  }
                })
              )
          )
          .catch((e) => winston.error(e))
      }
    })

    for (const inter of this.entry.interactions) {
      this.client.on(inter.type, (...args) => {
        let messages = ''
        let errors = ''
        let results = ''
        let failed = false

        this.entry
          .fetch()
          .then((discordUser) =>
            defineContext(this, inter.code, {
              premium: true,
              type: 'interaction',
              globals: {
                arguments: args,
              },
              print(...args: any[]) {
                messages += args.map((v) => v.toString()).join('\t') + '\n'
              },
            })
              .then((result) => {
                results = JSON.stringify(result)
              })
              .catch((e) => {
                failed = true
                errors += e.toString() + '\n'
                winston.error(e)
                DI.mail
                  .send(
                    this.entry.owner.email,
                    `Interaction Failure: Cerus - ${discordUser.username} - ${inter.type}`,
                    'failure',
                    {
                      type: 'interaction',
                      objectName: inter.type,
                      botName: discordUser.username,
                      botId: this.entry.id,
                      objectId: inter.id,
                      error: e,
                      messages,
                    }
                  )
                  .catch((e) => winston.error(e))
              })
              .finally(() =>
                setImmediate(async () => {
                  winston.debug('Adding bot call')
                  try {
                    await BotCall.query().insert({
                      interactionId: inter.id,
                      type: 'message',
                      failed,
                      createdAt: new Date(new Date().toUTCString()),
                      result: results,
                      errors,
                      messages,
                    })
                  } catch (e) {
                    winston.error(e)
                  }
                })
              )
          )
          .catch((e) => winston.error(e))
      })
    }
  }

  private setCommands(guild: string) {
    const cmds = this.entry.commands.map((cmd) => {
      const builder = new SlashCommandBuilder()
        .setName(cmd.name)
        .setDescription(
          typeof cmd.description !== 'string' ? 'Undescribed' : cmd.description
        )
        .toJSON()

      builder.options = JSON.parse(cmd.options || '[]') as any[]
      return builder
    })
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
    setImmediate(async () => {
      try {
        await this.updateCommands()
        this.client.user.setActivity('Hosted by Cerus', { type: 'STREAMING' })
      } catch (e) {
        winston.error(e)
        this.stop()
        DI.bots.delete(this.entry.id)
      }
    })
  }
}
