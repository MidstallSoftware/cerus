import { Router } from 'express'
import genController from '../../controllers/v1/admin'
import { validateAuth } from '../../middleware/auth'

export default function () {
  const router = Router()
  const controller = genController()

  router.get('/stats', validateAuth, controller.stats)
  return router
}
