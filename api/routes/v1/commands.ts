import { Router } from 'express'
import { validateAuth } from '../../middleware/auth'
import genController from '../../controllers/v1/commands'
import { validateBody, validateQuery } from '../../middleware/validate'

export default function (): Router {
  const router = Router()
  const controller = genController()

  router.get(
    '/export',
    validateAuth,
    validateQuery({
      type: 'object',
      properties: {
        id: { type: 'string', required: true, pattern: /[0-9]+/ },
      },
    }),
    controller.export
  )

  router.post(
    '/',
    validateAuth,
    validateQuery({
      type: 'object',
      properties: {
        botId: { type: 'string', required: true, pattern: /[0-9]+/ },
        name: { type: 'string', required: true, minLength: 1 },
      },
    }),
    controller.create
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
      minProperties: 1,
      properties: {
        name: { type: 'string', required: false, minLength: 1 },
        code: { type: 'string', required: false },
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
