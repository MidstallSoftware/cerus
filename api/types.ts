import { APIApplicationCommandOption } from 'discord-api-types/v9'
import { ClientEvents, Constants } from 'discord.js'

export const reportTypes = [
  'discord-tos',
  'scam',
  'illegal-content',
  'phishing',
] as const
export type APIReportType = typeof reportTypes[any]

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

export interface APIBotInteraction extends APIObject {
  botId: number
  type: keyof ClientEvents
  calls: APIInteractionCall[]
  code: string
}

export interface APIBot extends APIObject {
  name: string
  discordId: string
  avatar: string
  premium: boolean
  running: boolean
  messages: APIMessage[]
  commands: APICommand[]
  interactions: APIBotInteraction[]
  intents: number[]
  token?: string
}

export interface APIReport extends APIObject {
  type: APIReportType
  botId: number
  title: string
  content: string
  attachments: Record<string, Blob>
  resolved: boolean
}

export interface APIList<T extends APIObject> {
  list: T
  total: number
  pageSize: number
  offset: number
}

export const interactionTypes = Object.values(Constants.Events).filter(
  (v) =>
    ![
      'raw',
      'error',
      'warn',
      'debug',
      'messageCreate',
      'interactionCreate',
    ].includes(v)
)
