import { Router } from 'express'
import { validateAuth } from '../../middleware/auth'
import { validateQuery } from '../../middleware/validate'
import genController from '../../controllers/v1/reports'
import { reportTypes } from '../../types'

export default function () {
  const router = Router()
  const controller = genController()

  router.post(
    '/',
    validateAuth,
    validateQuery({
      type: 'object',
      properties: {
        botId: { type: 'string', required: true },
        type: {
          type: 'string',
          required: true,
          enum: reportTypes as unknown as string[],
        },
        title: { type: 'string', required: true },
        content: { type: 'string', required: true },
      },
    }),
    controller.create
  )

  return router
}
