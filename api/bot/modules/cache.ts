import { DI } from '../../di'
import { definedModule } from '../module'

export default definedModule(
  {
    name: 'cache',
    requiresPremium: true,
  },
  (mod) => {
    const keyName = (key: string) => `bot_${mod.instance.entry.id}_${key}`
    return {
      async get(key: string) {
        return await DI.redis.get(keyName(key))
      },
      async set(key: string, value: any, expires: number = 60) {
        return await DI.redis.set(keyName(key), value, {
          EX: expires,
        })
      },
      async exists(key: string) {
        return (await DI.redis.exists(keyName(key))) === 1
      },
      async keys(pattern: string) {
        return await DI.redis.keys(keyName(pattern))
      },
      async invalidate(key: string) {
        await DI.redis.del(keyName(key))
      },
    }
  }
)
