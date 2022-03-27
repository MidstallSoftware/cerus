import { QueryBuilder } from 'objection'
import Bot from '../database/entities/bot'
import BotCommand from '../database/entities/botcommand'
import BotMessage from '../database/entities/botmessage'
import { createQueryCache, createSingleQueryCache, fixDate } from '../utils'
import { APIBot } from '../types'
import { DI } from '../di'
import { fetchMessage } from './message'
import { fetchCommand } from './command'

export async function fetchBot(query: QueryBuilder<Bot, Bot>): Promise<APIBot> {
  const cache = createSingleQueryCache(Bot, query, 'bots')

  const value = await cache.read()

  const cacheMessages = createQueryCache(
    BotMessage,
    BotMessage.query().where('botId', value.id).select('id'),
    'messages'
  )
  const cacheCommands = createQueryCache(
    BotCommand,
    BotCommand.query().where('botId', value.id).select('id'),
    'commands'
  )

  const valueMessages = await cacheMessages.read()
  const valueCommands = await cacheCommands.read()

  return {
    id: value.id,
    name: (await value.fetch()).username,
    discordId: value.discordId,
    avatar: await value.getAvatar(),
    running: DI.bots.has(value.id),
    created: fixDate(value.created),
    premium: value.premium === 1,
    messages: await Promise.all(
      valueMessages.map((v) => fetchMessage(v.$query()))
    ),
    commands: await Promise.all(
      valueCommands.map((v) => fetchCommand(v.$query()))
    ),
  }
}
