import os from 'os'
import process from 'process'
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
import { sendCachedResponse } from '../../utils'

export default function () {
  return {
    stats: sendCachedResponse(() => {
      const memFree = os.freemem()
      const memTotal = os.totalmem()
      return new BaseMessage(
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
    }),
    info: sendCachedResponse(
      () =>
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
                      'REDIS_HOST',
                      'REDIS_PASSWORD',
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
    ),
  }
}
