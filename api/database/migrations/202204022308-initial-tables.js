exports.up = (knex) =>
  Promise.all([
    knex.schema.createTable('users', (table) => {
      table.increments('id').primary().unsigned()
      table.string('discordId').notNullable().unique()
      table.string('email').notNullable()
      table.string('customerId').notNullable()
      table
        .enum('type', ['default', 'admin'])
        .notNullable()
        .defaultTo('default')
      table.dateTime('created').notNullable()
    }),
    knex.schema.createTable('accessTokens', (table) => {
      table.increments('id').primary().unsigned()
      table.string('token').notNullable().unique()
      table
        .integer('userId')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
    }),
    knex.schema.createTable('bots', (table) => {
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
    }),
    knex.schema.createTable('botDataStores', (table) => {
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
    }),
    knex.schema.createTable('botCommands', (table) => {
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
    }),
    knex.schema.createTable('botMessages', (table) => {
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
    }),
    knex.schema.createTable('botCalls', (table) => {
      table.increments('id').primary().unsigned()
      table
        .integer('messageId')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('botMessages')
      table
        .integer('commandId')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('botCommands')
      table.string('result').nullable()
      table.string('errors').nullable()
      table.string('messages').nullable()
      table.string('guildId').notNullable()
      table.string('channelId').notNullable()
      table.string('callerId').notNullable()
      table.enum('type', ['command', 'message']).notNullable()
      table.boolean('failed')
      table.dateTime('dateTime').notNullable()
    }),
  ]).then((v) => v !== undefined)

exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('botDataStores'),
    knex.schema.dropTable('botCalls'),
    knex.schema.dropTable('botCommands'),
    knex.schema.dropTable('botMessages'),
    knex.schema.dropTable('bots'),
    knex.schema.dropTable('accessTokens'),
    knex.schema.dropTable('users'),
  ])
