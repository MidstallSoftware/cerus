import { MikroORM } from '@mikro-orm/core'
import { init as dbInit } from './database'

export const DI = {} as {
  orm: MikroORM
  server_start: Date
}

export async function init(): Promise<void> {
  DI.orm = await dbInit()
  DI.server_start = new Date()
}
