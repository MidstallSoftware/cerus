exports.up = (knex) =>
  knex.schema.alterTable('bots', (table) => {
    table.json('intents').defaultTo('[GUILD_MESSAGES,GUILDS]')
  })

exports.down = (knex) =>
  knex.schema.alterTable('bots', (table) => {
    table.dropColumn('intents')
  })
