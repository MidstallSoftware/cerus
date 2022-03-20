import { QueryBuilder } from 'objection'
import Bot from '../database/entities/bot'
import BotCommand from '../database/entities/botcommand'
import BotMessage from '../database/entities/botmessage'
import { createQueryCache, createSingleQueryCache, fixDate } from '../utils'
import { APIBot } from '../types'
import { DI } from '../di'
import { transformMessage } from './message'
import { transformCommand } from './command'

export async function fetchBot(query: QueryBuilder<Bot, Bot>): Promise<APIBot> {
  const cache = createSingleQueryCache(Bot, query, 'bots')

  const value = await cache.read()

  const cacheMessages = createQueryCache(
    BotMessage,
    BotMessage.query().where('botId', value.id),
    'messages'
  )
  const cacheCommands = createQueryCache(
    BotCommand,
    BotCommand.query().where('botId', value.id),
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
    messages: valueMessages.map(transformMessage),
    commands: valueCommands.map(transformCommand),
  }
}
