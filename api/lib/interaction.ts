import { QueryBuilder } from 'objection'
import BotCall from '../database/entities/botcall'
import BotInteraction from '../database/entities/botinteraction'
import { APIBotInteraction } from '../types'
import { createQueryCache, createSingleQueryCache, fixDate } from '../utils'
import { transformCall } from './call'

export function transformInteraction(intr: BotInteraction): APIBotInteraction {
  return {
    id: intr.id,
    type: intr.type,
    code: intr.code,
    botId: intr.botId,
    calls:
      typeof intr.calls === 'undefined' ? [] : intr.calls.map(transformCall),
    created: fixDate(intr.createdAt),
  }
}

export async function fetchInteraction(
  query: QueryBuilder<BotInteraction, BotInteraction>
) {
  const value = await createSingleQueryCache(
    BotInteraction,
    query.whereNull('deletedAt')
  ).read()

  const valueCalls = (await createQueryCache(
    BotCall,
    value.$relatedQuery('calls').whereNull('deletedAt')
  ).read()) as BotCall[]

  value.calls = valueCalls
  return transformInteraction(value)
}
