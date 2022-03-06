export interface APIMessage {
  id: number
  regex: string
}

export interface APICommand {
  id: number
  name: string
  premium: boolean
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
  messages: APIMessage[]
  commands: APICommand[]
}

export interface APIList<T> {
  list: T
  total: number
  pageSize: number
  offset: number
}
