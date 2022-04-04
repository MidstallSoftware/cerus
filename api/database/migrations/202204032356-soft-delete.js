exports.up = async (knex) => {
  await knex.schema.alterTable('accessTokens', (table) => {
    table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now())
    table.dateTime('deletedAt').nullable()
    table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.alterTable('botCalls', (table) => {
    table.renameColumn('dateTime', 'createdAt')
    table.dateTime('deletedAt').nullable()
    table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.alterTable('botDataStores', (table) => {
    table.renameColumn('created', 'createdAt')
    table.renameColumn('updated', 'updatedAt')
    table.dateTime('deletedAt').nullable()
  })

  for (const tableName of [
    'botCommands',
    'botInteractions',
    'botMessages',
    'bots',
    'botReports',
    'users',
  ])
    await knex.schema.alterTable(tableName, (table) => {
      table.renameColumn('created', 'createdAt')
      table.dateTime('deletedAt').nullable()
      table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now())
    })
}

exports.down = async (knex) => {
  for (const tableName of [
    'botCommands',
    'botInteractions',
    'botMessages',
    'bots',
    'botReports',
    'users',
  ])
    await knex.schema.alterTable(tableName, (table) => {
      table.renameColumn('createdAt', 'created')
      table.dropColumns('deletedAt', 'updatedAt')
    })

  await knex.schema.alterTable('accessTokens', (table) => {
    table.dropColumns('createdAt', 'deletedAt', 'updatedAt')
  })

  await knex.schema.alterTable('botCalls', (table) => {
    table.renameColumn('createdAt', 'dateTime')
    table.dropColumns('deletedAt', 'updatedAt')
  })

  await knex.schema.alterTable('botDataStores', (table) => {
    table.renameColumn('createdAt', 'created')
    table.renameColumn('updatedAt', 'updated')
    table.dropColumn('deletedAt')
  })
}
