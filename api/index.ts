import express from 'express'
import winston from './providers/winston'
import { notFoundHandler, errorHandler } from './middleware/error'
import genInstance from './routes/v1/instance'
import genUser from './routes/v1/user'
import { init } from './di'

const app = express()

app.use((req, _res, next) => {
  winston.debug(
    `receving request from ${req.protocol}://${req.hostname}${req.originalUrl} (${req.method})`
  )
  next()
})

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use('/v1/instance', genInstance())
app.use('/v1/user', genUser())
app.use(notFoundHandler)
app.use(errorHandler)

init()
  .then(() => {})
  .catch((e) => winston.error(e))

export default app
