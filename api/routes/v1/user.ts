import { Router } from 'express'
import { validateAuth } from '../../middleware/auth'
import genController from '../../controllers/v1/user'

export default function (): Router {
  const router = Router()
  const controller = genController()

  router.get('/', validateAuth, controller.info)
  return router
}
