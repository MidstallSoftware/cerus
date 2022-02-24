import { NextFunction, Request, Response } from 'express'

export default function () {
  return {
    info: (_req: Request, res: Response, next: NextFunction) => {
      try {
        res.json({})
      } catch (e) {
        next(e)
      }
    },
  }
}
