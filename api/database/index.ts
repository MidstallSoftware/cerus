import { join } from 'path'
import process from 'process'
import createKnex, { Knex } from 'knex'
import { Model } from 'objection'
import waitOn from 'wait-on'
import winston from '../providers/winston'
import config from './knexfile'

export async function init(): Promise<Knex> {
  await waitOn({ resources: ['tcp:' + process.env.MYSQL_HOST + ':3306'] })

  winston.debug(`Using knex configuration ${JSON.stringify(config)}`)
  const knex = createKnex(config)
  Model.knex(knex)

  winston.info('Beginning migrations')
  await knex.migrate.latest({
    directory: join(__dirname, 'migrations'),
    extension: 'ts',
    loadExtensions: ['.js'],
  })
  winston.info('Migrations have been completed')
  return knex
}
