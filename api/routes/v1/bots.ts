import { Router } from 'express'
import { validateAuth } from '../../middleware/auth'
import { validateBody, validateQuery } from '../../middleware/validate'
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

  router.patch(
    '/',
    validateAuth,
    validateQuery({
      type: 'object',
      properties: {
        id: { type: 'string', required: true, pattern: /[0-9]+/ },
      },
    }),
    validateBody({
      type: 'object',
      minItems: 1,
      properties: {
        running: { type: 'boolean' },
        discordId: { type: 'string' },
        token: { type: 'string' },
      },
    }),
    controller.update
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
    controller.get
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
