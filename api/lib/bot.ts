import { QueryBuilder } from 'objection'
import Bot from '../database/entities/bot'
import BotCommand from '../database/entities/botcommand'
import BotMessage from '../database/entities/botmessage'
import BotInteraction from '../database/entities/botinteraction'
import User from '../database/entities/user'
import { createQueryCache, createSingleQueryCache, fixDate } from '../utils'
import { APIBot } from '../types'
import BotInstance from '../bot'
import { DI } from '../di'
import { fetchMessage } from './message'
import { fetchCommand } from './command'
import { fetchInteraction } from './interaction'

export async function fetchBot(
  query: QueryBuilder<Bot, Bot>,
  token?: boolean
): Promise<APIBot> {
  const cache = createSingleQueryCache(
    Bot,
    query.whereNull('deletedAt'),
    'bots'
  )

  const value = await cache.read()

  const cacheMessages = createQueryCache(
    BotMessage,
    BotMessage.query()
      .where('botId', value.id)
      .whereNull('deletedAt')
      .select('id'),
    'messages'
  )
  const cacheCommands = createQueryCache(
    BotCommand,
    BotCommand.query()
      .where('botId', value.id)
      .whereNull('deletedAt')
      .select('id'),
    'commands'
  )
  const cacheInteractions = createQueryCache(
    BotInteraction,
    BotInteraction.query()
      .where('botId', value.id)
      .whereNull('deletedAt')
      .select('id'),
    'interactions'
  )

  const valueMessages = await cacheMessages.read()
  const valueCommands = await cacheCommands.read()
  const valueInteractions = await cacheInteractions.read()

  return {
    id: value.id,
    name: (await value.fetch()).username,
    discordId: value.discordId,
    avatar: await value.getAvatar(),
    running: DI.bots.has(value.id),
    created: fixDate(value.createdAt),
    premium: value.premium === 1,
    intents: value.intents,
    token: token ? value.token : null,
    messages: await Promise.all(
      valueMessages.map((v) => fetchMessage(v.$query()))
    ),
    commands: await Promise.all(
      valueCommands.map((v) => fetchCommand(v.$query()))
    ),
    interactions: await Promise.all(
      valueInteractions.map((v) => fetchInteraction(v.$query()))
    ),
  }
}

export async function startBot(bot: Bot) {
  const cacheMessages = createQueryCache(
    BotMessage,
    BotMessage.query().where('botId', bot.id).whereNull('deletedAt'),
    'messages'
  )
  const cacheCommands = createQueryCache(
    BotCommand,
    BotCommand.query().where('botId', bot.id).whereNull('deletedAt'),
    'commands'
  )
  const cacheInteractions = createQueryCache(
    BotInteraction,
    BotInteraction.query().where('botId', bot.id).whereNull('deletedAt'),
    'interactions'
  )

  const cacheUser = createSingleQueryCache(
    User,
    User.query().findOne({ id: bot.ownerId }).whereNull('deletedAt')
  )

  const valueMessages = await cacheMessages.read()
  const valueCommands = await cacheCommands.read()
  const valueInteractions = await cacheInteractions.read()
  const valeuUser = await cacheUser.read()

  await bot.$query().patchAndFetch({
    running: true,
  })

  bot.messages = valueMessages
  bot.commands = valueCommands
  bot.interactions = valueInteractions
  bot.owner = valeuUser

  const inst = new BotInstance(bot)
  await inst.init()
  DI.bots.set(bot.id, inst)
}
