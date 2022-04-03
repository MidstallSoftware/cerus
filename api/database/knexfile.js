const { join } = require('path')

const env = process.env.NODE_ENV || 'development'
const production = env === 'production'

const base = {
  useNullAsDefault: true,
  debug: !production,
  migrations: {
    directory: join(__dirname, 'migrations'),
    extension: 'ts',
    loadExtensions: ['.js', '.ts'],
  },
  seeds: {
    directory: join(__dirname, 'seeds'),
  },
}

const config = {
  development: {
    ...base,
    client: 'sqlite3',
    connection: {
      filename: join(__dirname, '..', '..', 'database-debug.sqlite'),
    },
  },
  production: {
    ...base,
    client: 'mysql2',
    connection: {
      database: process.env.MYSQL_DATABASE,
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
    },
  },
}

module.exports = (() => {
  if (!production && process.env.USE_MYSQL) return { ...config.production }
  return config[env]
})()
