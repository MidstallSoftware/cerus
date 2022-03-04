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
import { createQueryCache, sendCachedResponse } from '../../utils'
import Bot from '../../database/entities/bot'
import User from '../..//database/entities/user'

export default function () {
  return {
    stats: sendCachedResponse(async () => {
      const memFree = os.freemem()
      const memTotal = os.totalmem()
      const onlineBots = DI.bots.size
      const totalBots = (
        await createQueryCache(Bot, Bot.query().count('id')).read()
      ).length
      const totalAdminUsers = (
        (
          await createQueryCache(
            User,
            User.query().where('type', 'admin').count('type')
          ).read()
        )[0] as any
      )['count(`type`)'] as number
      const totalNormalUsers = (
        (
          await createQueryCache(
            User,
            User.query().where('type', 'default').count('type')
          ).read()
        )[0] as any
      )['count(`type`)'] as number
      const totalUsers = (
        (
          await createQueryCache(User, User.query().count('id')).read()
        )[0] as any
      )['count(`id`)'] as number
      return new BaseMessage(
        {
          bots: {
            online: onlineBots,
            offline: totalBots - onlineBots,
            total: totalBots,
          },
          users: {
            admins: totalAdminUsers,
            normal: totalNormalUsers,
            total: totalUsers,
          },
          uptime: {
            server: Date.now() - DI.server_start.getTime(),
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
                      'STRIPE_WEBHOOK_SECRET',
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
