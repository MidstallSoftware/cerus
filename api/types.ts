import { APIApplicationCommandOption } from 'discord-api-types/v9'

export interface APIObject {
  id: number
  created: Date
}

export interface APICommandCallSummary {
  thisMonth: number
  thisYear: number
  lifetime: number
  results: string[]
  errors: string[]
  messages: string[]
}

export interface APIInteractionCall {
  id: number
  result: string
  error: string
  message: string
  callerId: string
  timestamp: Date
  failed: boolean
  guildId: string
  channelId: string
}

export interface APIMessage extends APIObject {
  botId: number
  regex: string
  code: string
  calls: APIInteractionCall[]
}

export interface APICommand extends APIObject {
  botId: number
  name: string
  premium: boolean
  calls: APICommandCallSummary | APIInteractionCall[]
  code: string
  description: string
  options: APIApplicationCommandOption[]
}

export interface APIBot extends APIObject {
  name: string
  discordId: string
  avatar: string
  premium: boolean
  running: boolean
  messages: APIMessage[]
  commands: APICommand[]
}

export interface APIList<T> {
  list: T
  total: number
  pageSize: number
  offset: number
}
