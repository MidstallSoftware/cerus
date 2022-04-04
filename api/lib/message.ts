import { QueryBuilder } from 'objection'
import BotCall from '../database/entities/botcall'
import BotMessage from '../database/entities/botmessage'
import { createQueryCache, createSingleQueryCache, fixDate } from '../utils'
import { APIMessage } from '../types'
import { transformCall } from './call'

export function transformMessage(msg: BotMessage): APIMessage {
  return {
    id: msg.id,
    botId: msg.botId,
    regex: msg.regex,
    code: msg.code,
    created: fixDate(msg.createdAt),
    calls: (msg.calls || []).map(transformCall),
  }
}

export async function fetchMessage(
  query: QueryBuilder<BotMessage, BotMessage>
) {
  const value = await createSingleQueryCache(
    BotMessage,
    query.whereNull('deletedAt')
  ).read()
  const valueCalls = (await createQueryCache(
    BotCall,
    value.$relatedQuery('calls').whereNull('deletedAt')
  ).read()) as BotCall[]

  value.calls = valueCalls
  return transformMessage(value)
}
