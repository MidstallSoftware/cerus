const { Constants } = require('discord.js')

exports.up = (knex) =>
  Promise.all([
    knex.schema.createTable('botInteractions', (table) => {
      table.increments('id').primary().unsigned()
      table.enum(
        'type',
        Object.values(Constants.Events).filter(
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
      )
      table
        .integer('botId')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('bots')
      table.text('code').nullable()
      table.dateTime('created').notNullable()
    }),
    knex.schema.alterTable('botCalls', (table) => {
      table
        .integer('interactionId')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('botInteractions')
    }),
  ])

exports.down = (knex) => Promise.all([knex.schema.dropTable('botInteractions')])
