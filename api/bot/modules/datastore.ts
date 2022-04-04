import { createSingleQueryCache, createQueryCache, fixDate } from '../../utils'
import BotDataStore from '../../database/entities/botdatastore'
import { definedModule, Module } from '../module'

const createStore = (mod: Module, key: string) =>
  createSingleQueryCache(
    BotDataStore,
    BotDataStore.query()
      .findOne({
        botId: mod.instance.entry.id,
        key,
      })
      .whereNull('deletedAt')
  )

const createMultiStore = (mod: Module, key: string) =>
  createQueryCache(
    BotDataStore,
    BotDataStore.query()
      .where('botId', mod.instance.entry.id)
      .where('key', key)
      .whereNull('deletedAt')
  )

export default definedModule(
  {
    name: 'datastore',
    requiresPremium: true,
  },
  (mod) => {
    return {
      async get(key: string): Promise<any> {
        const cacheStore = createStore(mod, key)
        const store = await cacheStore.read()
        return JSON.parse(store.value || 'null')
      },
      async set(key: string, value: any): Promise<void> {
        const multiStore = await createMultiStore(mod, key).read()
        if (multiStore.length === 0) {
          await BotDataStore.query().insert({
            botId: mod.instance.entry.id,
            key,
            value: JSON.stringify(value),
            createdAt: new Date(new Date().toUTCString()),
            updatedAt: new Date(new Date().toUTCString()),
          })
        } else {
          await multiStore[0].$query().patch({
            updatedAt: new Date(new Date().toUTCString()),
            value: JSON.stringify(value),
          })
        }
      },
      async lookup(
        key: string
      ): Promise<{ created: Date; updated: Date; value: any } | undefined> {
        const multiStore = await createMultiStore(mod, key).read()
        return multiStore.length === 0
          ? undefined
          : {
              created: fixDate(multiStore[0].createdAt),
              updated: fixDate(multiStore[0].updatedAt),
              value: JSON.parse(multiStore[0].value || 'null'),
            }
      },
      async list(): Promise<string[]> {
        const value = await createQueryCache(
          BotDataStore,
          BotDataStore.query().where('botId', mod.instance.entry.id)
        ).read()
        return value.map((v) => v.key)
      },
      async invalidateCache(key: string) {
        const cacheStore = createStore(mod, key)
        await cacheStore.invalidate()
      },
      async delete(key: string): Promise<boolean> {
        return (
          (await BotDataStore.query()
            .where('botId', mod.instance.entry.id)
            .where('key', key)
            .patch({
              deletedAt: new Date(),
            })) > 0
        )
      },
      async exists(key: string): Promise<boolean> {
        const multiStore = await createMultiStore(mod, key).read()
        return multiStore.length > 0
      },
    }
  }
)
