import { createLogger, format, transports } from 'winston'
import { KafkaTransport, KafkaTransportConfig } from 'winston-logger-kafka'
import TransportStream from 'winston-transport'

const env = process.env.NODE_ENV || 'development'

const logLevels: Record<string, string> = {
  test: 'error',
  development: 'debug',
  production: 'info',
}

const kafkaConfig: KafkaTransportConfig = {
  clientConfig: { brokers: process.env.KAFKA_BROKERS.split(',') },
  producerConfig: { allowAutoTopicCreation: true },
  sinkTopic: 'cerus-winston',
}

const logger = createLogger({
  level: logLevels[env],
  format: format.combine(format.colorize(), format.splat(), format.simple()),
  transports: [
    new transports.Console(),
    new KafkaTransport(kafkaConfig) as unknown as TransportStream,
  ],
})

export default logger
