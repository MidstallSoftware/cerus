const { interactionTypes } = require('../../types')

exports.up = (knex) =>
  Promise.all([
    knex.schema.createTable('botInteractions', (table) => {
      table.increments('id').primary().unsigned()
      table.enum('type', interactionTypes)
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

exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('botInteractions'),
    knex.schema.alterTable('botCalls', (table) => {
      table.dropColumn('interactionId')
    }),
  ])
