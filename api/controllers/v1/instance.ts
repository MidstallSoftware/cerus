import os from 'os'
import process from 'process'
import { Request, Response, NextFunction } from 'express'
import { BaseMessage } from '../../message'
import {
  version,
  repository,
  homepage,
  devDependencies,
  author,
  license,
} from '../../../package.json'
import { DI } from '../../di'

export default function () {
  return {
    stats: (_req: Request, res: Response, next: NextFunction) => {
      try {
        const memFree = os.freemem()
        const memTotal = os.totalmem()
        res.json(
          new BaseMessage(
            {
              uptime: {
                server: DI.server_start,
                process: process.uptime(),
                system: os.uptime(),
              },
              memory: {
                free: memFree,
                total: memTotal,
                used: memTotal - memFree,
              },
              process: {
                resource_usage: process.resourceUsage(),
              },
              processors: os.cpus(),
              loadavg: os.loadavg(),
            },
            'instance:stats'
          )
        )
      } catch (e) {
        next(e)
      }
    },
    info: (_req: Request, res: Response, next: NextFunction) => {
      try {
        res.json(
          new BaseMessage(
            {
              implements: ['v1'],
              process: {
                pid: process.pid,
                env: Object.fromEntries(
                  Object.entries(process.env).filter(
                    ([key]) =>
                      ![
                        'MYSQL_HOST',
                        'MYSQL_PASSWORD',
                        'MYSQL_USER',
                        'MYSQL_DATABASE',
                        'DISCORD_CLIENT_ID',
                        'DISCORD_CLIENT_SECRET',
                        'STRIPE_KEY',
                      ].includes(key)
                  )
                ),
              },
              repository,
              homepage,
              devDependencies,
              author,
              license,
              version,
            },
            'instance:info'
          )
        )
      } catch (e) {
        next(e)
      }
    },
  }
}
