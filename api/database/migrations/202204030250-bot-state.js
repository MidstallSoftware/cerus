exports.up = (knex) =>
  knex.schema.alterTable('botCalls', (table) => {
    table.string('guildId').nullable().alter()
    table.string('channelId').nullable().alter()
    table.string('callerId').nullable().alter()
    table
      .enum('type', ['command', 'message', 'interaction'])
      .notNullable()
      .alter()
  })

exports.down = (knex) =>
  knex.schema.alterTable('botCalls', (table) => {
    table.string('guildId').notNullable().alter()
    table.string('channelId').notNullable().alter()
    table.string('callerId').notNullable().alter()
    table.enum('type', ['command', 'message']).notNullable().alter()
  })
