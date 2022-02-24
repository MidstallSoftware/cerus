import { NextFunction, Request, Response } from 'express'
import winston from '../providers/winston'
import { HttpUnauthorizedError } from '../exceptions'
import { checkAccessToken } from '../lib/accesstoken'

export function validateAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (typeof header === 'undefined') {
    next(new HttpUnauthorizedError('Not authorization header was given'))
  }

  ;(async () => {
    try {
      const accessToken = await checkAccessToken(header)
      res.locals.auth = { accessToken, user: accessToken.user }

      next()
    } catch (e) {
      winston.error(e)
      next(e)
    }
  })()
}
