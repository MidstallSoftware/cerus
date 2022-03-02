import { createLogger, format, transports } from 'winston'

const env = process.env.NODE_ENV || 'development'

const logLevels: Record<string, string> = {
  test: 'error',
  development: 'debug',
  production: 'info',
}

const logger = createLogger({
  level: logLevels[env],
  format: format.combine(format.colorize(), format.splat(), format.simple()),
  transports: [new transports.Console()],
})

export default logger
