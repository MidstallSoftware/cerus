import { cpus, loadavg } from 'os'
import { NextFunction, Request, Response } from 'express'
import User from '../../database/entities/user'
import { BaseMessage } from '../../message'
import { HttpUnauthorizedError } from '../../exceptions'

type CPUTimingType = 'user' | 'nice' | 'sys' | 'idle' | 'irq'

export default function () {
  return {
    stats: (_req: Request, res: Response, next: NextFunction) => {
      try {
        if (!res.locals.auth && !res.locals.auth.user)
          throw new HttpUnauthorizedError('User is not authenticated')

        const user: User = res.locals.auth.user
        if (user.type !== 'admin')
          throw new HttpUnauthorizedError('Must be an admin to access this')

        const times: Record<CPUTimingType, number> = {
          user: 0,
          nice: 0,
          sys: 0,
          idle: 0,
          irq: 0,
        }

        const processors = cpus()
        for (const proc of processors) {
          for (const key in proc.times) {
            times[key as CPUTimingType] += proc.times[key as CPUTimingType]
          }
        }

        res.json(
          new BaseMessage(
            {
              cpuUsage: Object.fromEntries(
                Object.entries(times).map(([key, value]) => [
                  key,
                  Math.round((100 * value) / processors.length),
                ])
              ),
              load: loadavg(),
            },
            'admin:stats'
          )
        )
      } catch (e) {
        next(e)
      }
    },
  }
}
