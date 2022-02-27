import { Router } from 'express'
import { validateAuth } from '../../middleware/auth'
import { validateQuery } from '../../middleware/validate'
import genController from '../../controllers/v1/bots'

export default function (): Router {
  const router = Router()
  const controller = genController()

  router.post(
    '/',
    validateAuth,
    validateQuery({
      type: 'object',
      properties: {
        discordId: { type: 'string', required: true },
        token: { type: 'string', required: true },
      },
    }),
    controller.create
  )

  router.get(
    '/',
    validateAuth,
    validateQuery({
      type: 'object',
      properties: {
        id: { type: 'string', required: true, pattern: /[0-9]+/ },
      },
    }),
    controller.list
  )

  router.delete(
    '/',
    validateAuth,
    validateQuery({
      type: 'object',
      properties: {
        id: { type: 'string', required: true, pattern: /[0-9]+/ },
      },
    }),
    controller.destroy
  )

  router.get(
    '/list',
    validateAuth,
    validateQuery({
      type: 'object',
      properties: {
        offset: {
          type: 'string',
          pattern: /[0-9]+/,
          required: false,
        },
        count: {
          type: 'string',
          pattern: /[0-9]+/,
          required: false,
        },
      },
    }),
    controller.list
  )
  return router
}
