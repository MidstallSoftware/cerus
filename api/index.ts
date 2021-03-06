import cors from 'cors'
import express, {
  urlencoded,
  json,
  raw,
  Request,
  Response,
  NextFunction,
} from 'express'
import fileUpload from 'express-fileupload'
import winston from './providers/winston'
import { notFoundHandler, errorHandler } from './middleware/error'
import genAdmin from './routes/v1/admin'
import genBilling from './routes/v1/billing'
import genBots from './routes/v1/bots'
import genCommands from './routes/v1/commands'
import genMessages from './routes/v1/messages'
import genInstance from './routes/v1/instance'
import genInteractions from './routes/v1/interactions'
import genReports from './routes/v1/reports'
import genUser from './routes/v1/user'
import genBillingController from './controllers/v1/billing'
import { init } from './di'

const app = express()

app.use(cors())
app.use(
  fileUpload({
    preserveExtension: true,
    debug: (process.env.NODE_ENV || 'development') !== 'development',
  })
)

app.use((req: Request, _res: Response, next: NextFunction) => {
  winston.debug(
    `receiving request from ${req.protocol}://${req.hostname}${req.originalUrl} (${req.method})`
  )
  next()
})

app.post(
  '/v1/billing/webhook',
  raw({ type: '*/*' }),
  genBillingController().webhook
)

app.use(urlencoded({ extended: false }))
app.use(json())
app.use('/v1/admin', genAdmin())
app.use('/v1/billing', genBilling())
app.use('/v1/bots', genBots())
app.use('/v1/commands', genCommands())
app.use('/v1/messages', genMessages())
app.use('/v1/instance', genInstance())
app.use('/v1/interactions', genInteractions())
app.use('/v1/reports', genReports())
app.use('/v1/user', genUser())
app.use(notFoundHandler)
app.use(errorHandler)

init()
  .then(() => {})
  .catch((e) => winston.error(e))

export default app
