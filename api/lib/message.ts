import { QueryBuilder } from 'objection'
import BotMessage from '../database/entities/botmessage'
import { createSingleQueryCache, fixDate } from '../utils'
import { APIMessage } from '../types'
import { transformCall } from './call'

export function transformMessage(msg: BotMessage): APIMessage {
  return {
    id: msg.id,
    regex: msg.regex,
    code: msg.code,
    created: fixDate(msg.created),
    calls: (msg.calls || []).map(transformCall),
  }
}

export async function fetchMessage(
  query: QueryBuilder<BotMessage, BotMessage>
) {
  return transformMessage(
    await createSingleQueryCache(BotMessage, query).read()
  )
}
