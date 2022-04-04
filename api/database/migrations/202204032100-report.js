exports.up = (knex) =>
  knex.schema.createTable('botReports', (table) => {
    table.increments('id').primary().unsigned()
    table
      .integer('botId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('bots')
    table
      .integer('userId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
    table
      .enum('type', ['discord-tos', 'scam', 'illegal-content', 'phishing'])
      .notNullable()
    table.text('title').notNullable()
    table.text('content').notNullable()
    table.boolean('resolved').defaultTo(false)
    table.dateTime('created').notNullable()
  })

exports.down = (knex) => knex.schema.dropTable('botReports')
