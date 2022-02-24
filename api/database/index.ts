import path from 'path'
import createKnex, { Knex } from 'knex'
import { Model } from 'objection'
import waitOn from 'wait-on'
import winston from '../providers/winston'

const env = process.env.NODE_ENV || 'development'
const production = env === 'production'

const config: Record<string, object> = {
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
      database: process.env.MYSQL_DB,
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
    },
  },
}

export async function init(): Promise<Knex> {
  if (env !== 'development')
    await waitOn({ resources: ['tcp:' + process.env.MYSQL_HOST + ':3306'] })
  winston.debug(`Using knex configuration ${JSON.stringify(config[env])}`)
  const knex = createKnex(config[env])
  Model.knex(knex)

  const tables: Record<string, (tableBuilder: Knex.CreateTableBuilder) => any> =
    {
      accessTokens: (table) => {
        table.increments('id').primary()
        table.string('token').notNullable()
        table.integer('userId').references('users.id')
      },
      bots: (table) => {
        table.increments('id').primary()
        table.string('name').notNullable()
        table.integer('ownerId').references('users.id')
        table.dateTime('created').notNullable()
      },
      botCommands: (table) => {
        table.increments('id').primary()
        table.string('name').notNullable()
        table.integer('botId').references('bots.id')
        table.boolean('premium').defaultTo(false)
        table.text('code').nullable()
        table.dateTime('created').notNullable()
      },
      commandCalls: (table) => {
        table.increments('id').primary()
        table.integer('commandId').references('botCommands.id')
        table.dateTime('dateTime').notNullable()
      },
      invoices: (table) => {
        table.increments('id').primary()
        table.integer('userId').references('users.id')
        table.integer('totalAmount')
        table.integer('totalCalls')
        table.integer('totalCommands')
        table.date('date')
        table.boolean('paid').defaultTo(false)
      },
      users: (table) => {
        table.increments('id').primary()
        table.string('discordId').notNullable().unique()
        table.string('email').notNullable()
        table
          .enum('type', ['default', 'admin'])
          .notNullable()
          .defaultTo('default')
        table.dateTime('created').notNullable()
      },
    }
  for (const tableName of Object.keys(tables)) {
    if (await knex.schema.hasTable(tableName)) continue
    await knex.schema.createTable(tableName, tables[tableName])
  }
  return knex
}
