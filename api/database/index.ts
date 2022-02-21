import { MikroORM } from '@mikro-orm/core'
import Bot from './entities/bot'
import BotCommand from './entities/botcommand'

const env = process.env.NODE_ENV || 'development'
const production = env === 'production'

export async function init(): Promise<MikroORM> {
  return await MikroORM.init({
    clientUrl: `mariadb://${process.env.MYSQL_USER}:${process.env.MYSQL_PASSWORD}@db/${process.env.MYSQL_USER}`,
    debug: !production,
    type: 'mariadb',
    entities: [Bot, BotCommand],
  })
}
