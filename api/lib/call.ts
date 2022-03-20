import BotCall from '../database/entities/botcall'
import { fixDate } from '../utils'
import { APIInteractionCall } from '../types'

export function transformCall(call: BotCall): APIInteractionCall {
  return {
    id: call.id,
    result: call.result,
    error: call.errors,
    message: call.messages,
    callerId: call.callerId,
    timestamp: fixDate(call.dateTime),
    failed: call.failed,
    guildId: call.guildId,
    channelId: call.channelId,
  }
}
