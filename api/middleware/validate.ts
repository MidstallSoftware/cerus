import { Request, Response, NextFunction } from 'express'
import { validate, Schema } from 'jsonschema'
import { HttpValidationError } from '../exceptions'

export function validateBody(schema: Schema) {
  return function notFoundHandler(
    req: Request,
    _res: Response,
    next: NextFunction
  ) {
    const v = validate(req.body, schema)

    if (v.valid) {
      next()
    } else {
      next(new HttpValidationError(v.errors))
    }
  }
}
