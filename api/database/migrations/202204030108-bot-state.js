exports.up = (knex) =>
  knex.schema.alterTable('bots', (table) => {
    table.boolean('running').defaultTo(false)
  })

exports.down = (knex) =>
  knex.schema.alterTable('bots', (table) => {
    table.dropColumn('running')
  })
