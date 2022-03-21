import path from 'path'
import createKnex, { Knex } from 'knex'
import { Model } from 'objection'
import waitOn from 'wait-on'
import winston from '../providers/winston'

const env = process.env.NODE_ENV || 'development'
const production = env === 'production'

const config: Record<string, Knex.Config> = {
  development: {
    client: 'sqlite3',
    useNullAsDefault: true,
    debug: true,
    connection: {
      filename: path.join(__dirname, '..', '..', 'database-debug.sqlite'),
    },
  },
  production: {
    client: 'mysql2',
    useNullAsDefault: true,
    debug: !production,
    connection: {
      database: process.env.MYSQL_DATABASE,
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
    },
  },
}

const getConfig = (): Knex.Config => {
  if (!production && process.env.USE_MYSQL) return { ...config.production }
  return config[env]
}

export async function init(): Promise<Knex> {
  await waitOn({ resources: ['tcp:' + process.env.MYSQL_HOST + ':3306'] })

  const cfg = getConfig()
  winston.debug(`Using knex configuration ${JSON.stringify(cfg)}`)
  const knex = createKnex(cfg)
  Model.knex(knex)

  const tables: Record<string, (tableBuilder: Knex.CreateTableBuilder) => any> =
    {
      users: (table) => {
        table.increments('id').primary().unsigned()
        table.string('discordId').notNullable().unique()
        table.string('email').notNullable()
        table.string('customerId').notNullable()
        table
          .enum('type', ['default', 'admin'])
          .notNullable()
          .defaultTo('default')
        table.dateTime('created').notNullable()
      },
      bots: (table) => {
        table.increments('id').primary().unsigned()
        table
          .integer('ownerId')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('users')
        table.string('discordId').notNullable().unique()
        table.string('token').notNullable().unique()
        table.boolean('premium').defaultTo(false)
        table.dateTime('created').notNullable()
      },
      botMessages: (table) => {
        table.increments('id').primary().unsigned()
        table.string('regex').notNullable()
        table
          .integer('botId')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('bots')
        table.text('code').nullable()
        table.dateTime('created').notNullable()
      },
      botCommands: (table) => {
        table.increments('id').primary().unsigned()
        table.string('name').notNullable()
        table
          .integer('botId')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('bots')
        table.boolean('premium').defaultTo(false)
        table.json('options').defaultTo('[]')
        table.text('description').nullable()
        table.text('code').nullable()
        table.dateTime('created').notNullable()
      },
      botDataStores: (table) => {
        table.increments('id').primary().unsigned()
        table
          .integer('botId')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('bots')
        table.string('key').notNullable()
        table.text('value').nullable()
        table.dateTime('created').notNullable()
        table.dateTime('updated').notNullable()
      },
      accessTokens: (table) => {
        table.increments('id').primary().unsigned()
        table.string('token').notNullable().unique()
        table
          .integer('userId')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('users')
      },
      botCalls: (table) => {
        table.increments('id').primary().unsigned()
        table
          .integer('commandId')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('botCommands')
        table
          .integer('messageId')
          .unsigned()
          .notNullable()
          .references('id')
          .inTable('botMessages')
        table.string('result').nullable()
        table.string('errors').nullable()
        table.string('messages').nullable()
        table.string('guildId').notNullable()
        table.string('channelId').notNullable()
        table.string('callerId').notNullable()
        table.enum('type', ['command', 'message']).notNullable()
        table.boolean('failed')
        table.dateTime('dateTime').notNullable()
      },
    }
  for (const tableName of Object.keys(tables)) {
    if (await knex.schema.hasTable(tableName)) continue
    await knex.schema.createTable(tableName, tables[tableName])
  }
  return knex
}
