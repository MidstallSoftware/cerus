import { Router } from 'express'
import { validateBody } from '../../middleware/validate'
import genController from '../../controllers/v1/billing'

export default function (): Router {
  const router = Router()
  const controller = genController()

  router.post(
    '/checkout',
    validateBody({
      type: 'object',
      properties: {
        lookup_key: { type: 'string', required: true },
        url: { type: 'string', required: true },
        id: { type: 'number', required: true },
        type: { type: 'string', enum: ['bot', 'command'], required: true },
      },
    }),
    controller.checkout
  )

  router.post(
    '/portal',
    validateBody({
      type: 'object',
      properties: {
        id: { type: 'string', required: true },
        url: { type: 'string', required: true },
      },
    }),
    controller.portal
  )
  return router
}
