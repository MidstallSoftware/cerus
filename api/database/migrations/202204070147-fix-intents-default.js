exports.up = async (knex) => {
  await knex.schema.alterTable('bots', (table) => {
    table.dropColumn('intents')
  })

  await knex.schema.alterTable('bots', (table) => {
    table.json('intents').defaultTo('["GUILD_MESSAGES","GUILDS"]')
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('bots', (table) => {
    table.dropColumn('intents')
  })

  await knex.schema.alterTable('bots', (table) => {
    table.json('intents').defaultTo('[GUILD_MESSAGES,GUILDS]')
  })
}
