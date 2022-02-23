import { Knex } from 'knex'
import { init as dbInit } from './database'

export const DI = {} as {
  knex: Knex
  server_start: Date
}

export async function init(): Promise<void> {
  DI.knex = await dbInit()
  DI.server_start = new Date()
}
