export interface APIMessage {
  id: number
  regex: string
}

export interface APICommand {
  id: number
  name: string
  premium: boolean
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
