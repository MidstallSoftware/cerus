export interface APIObject {
  id: number
  created: Date
}

export interface APICommandCallSummary {
  thisMonth: number
  thisYear: number
  lifetime: number
  result: string
  errors: string
  messages: string
}

export interface APICommandCall {
  id: number
  callerId: string
  timestamp: Date
}

export interface APIMessage extends APIObject {
  regex: string
  code: string
}

export interface APICommand extends APIObject {
  botId: number
  name: string
  premium: boolean
  calls: APICommandCallSummary | APICommandCall[]
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
}

export interface APIList<T> {
  list: T
  total: number
  pageSize: number
  offset: number
}
