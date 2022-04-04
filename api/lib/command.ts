import { QueryBuilder } from 'objection'
import { createQueryCache, createSingleQueryCache, fixDate } from '../utils'
import BotCall from '../database/entities/botcall'
import BotCommand from '../database/entities/botcommand'
import { APICommand, APICommandCallSummary } from '../types'
import { transformCall } from './call'

export function transformCommand(cmd: BotCommand): APICommand {
  return {
    id: cmd.id,
    botId: cmd.botId,
    name: cmd.name,
    premium: cmd.premium === 1,
    code: cmd.code,
    description: cmd.description,
    options: JSON.parse(cmd.options || '[]'),
    calls:
      typeof cmd.calls === 'undefined'
        ? []
        : cmd.premium === 1
        ? cmd.calls.map(transformCall)
        : ({
            thisMonth: cmd.calls.filter(
              (c) => fixDate(c.createdAt).getMonth() === new Date().getMonth()
            ).length,
            thisYear: cmd.calls.filter(
              (c) =>
                fixDate(c.createdAt).getFullYear() === new Date().getFullYear()
            ).length,
            lifetime: cmd.calls.length,
            results: cmd.calls.map((c) => c.result),
            errors: cmd.calls.map((c) => c.errors),
            messages: cmd.calls.map((c) => c.messages),
          } as APICommandCallSummary),
    created: fixDate(cmd.createdAt),
  }
}

export async function fetchCommand(
  query: QueryBuilder<BotCommand, BotCommand>
) {
  const value = await createSingleQueryCache(
    BotCommand,
    query.whereNull('deletedAt')
  ).read()

  const valueCalls = (await createQueryCache(
    BotCall,
    value.$relatedQuery('calls').whereNull('deletedAt')
  ).read()) as BotCall[]

  value.calls = valueCalls
  return transformCommand(value)
}
