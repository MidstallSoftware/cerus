import winston from 'winston'

const env = process.env.NODE_ENV || 'development'

const logLevels: Record<string, string> = {
  test: 'error',
  development: 'debug',
  production: 'info',
}

const logger = winston.createLogger({
  level: logLevels[env],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
})

export default logger
