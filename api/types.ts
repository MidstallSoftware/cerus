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

export interface APIMessage {
  id: number
  regex: string
  code: string
  created: Date
}

export interface APICommand {
  id: number
  botId: number
  name: string
  premium: boolean
  calls: APICommandCallSummary | APICommandCall[]
  created: Date
  code: string
}

export interface APIBot {
  id: number
  name: string
  discordId: string
  avatar: string
  created: Date
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
