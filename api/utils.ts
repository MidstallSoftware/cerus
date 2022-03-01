import { Model, Page, QueryBuilder } from 'objection'
import { DI } from './di'
import winston from './providers/winston'

export function getInt(
  str?: string | undefined | null,
  def: number = 0
): number {
  const v = parseInt(str)
  if (isNaN(v)) return def
  return v
}

export interface CacheOptions<T> {
  fetch(): Promise<T>
  read(data: string): Promise<T>
  write(data: T): Promise<string>
}

export async function getCache<T>(
  key: string,
  opts: CacheOptions<T>
): Promise<T> {
  const exists = await DI.redis.exists(key)
  if (exists === 1) {
    winston.debug(`Fetching "${key}" from cache`)
    const value = (await DI.redis.get(key)) as string
    return opts.read(value)
  } else {
    winston.debug(`Saving "${key}" to cache`)
    const value = await opts.write(await opts.fetch())
    DI.redis.set(key, value, {
      EX: 60 * 60 * 24,
    })
    return opts.read(value)
  }
}

export async function setCache<T>(
  key: string,
  data: T,
  opts: CacheOptions<T>
): Promise<void> {
  winston.debug(`Storing "${key}" in cache`)
  await DI.redis.del(key)
  const value = await opts.write(data)
  await DI.redis.set(key, value, {
    EX: 60 * 60 * 24,
  })
}

export interface Cache<T> {
  write(data: T): Promise<void>
  read(): Promise<T>
}

export function createCache<T>(key: string, opts: CacheOptions<T>): Cache<T> {
  return {
    write(data: T): Promise<void> {
      return setCache(key, data, opts)
    },
    read(): Promise<T> {
      return getCache(key, opts)
    },
  }
}

export async function invalidateCacheWithPrefix(prefix: string) {
  const keys = await DI.redis.keys(prefix + '*')
  for (const key in keys) {
    await DI.redis.del(key)
  }
}

export function createQueryCache<M extends Model>(
  OModel: typeof Model,
  query: QueryBuilder<M, M[]>,
  prefix: string = 'db'
): Cache<M[]> {
  const { bindings, sql } = query.toKnexQuery().toSQL()
  return createCache(`${prefix}_${sql}:${bindings}`, {
    async fetch() {
      return await query.execute()
    },
    read(data: string): Promise<M[]> {
      const values = JSON.parse(data) as any[]
      const models = values.map((value) => OModel.fromJson(value))
      return Promise.resolve(models as M[])
    },
    write(data: M[]) {
      return Promise.resolve(JSON.stringify(data.map((d) => d.toJSON())))
    },
  })
}

export function createSingleQueryCache<M extends Model>(
  OModel: typeof Model,
  query: QueryBuilder<M, M>,
  prefix: string = 'db'
): Cache<M> {
  const { bindings, sql } = query.toKnexQuery().toSQL()
  return createCache(`${prefix}_${sql}:${bindings}`, {
    async fetch() {
      return await query.execute()
    },
    read(data: string): Promise<M> {
      return Promise.resolve(OModel.fromJson(JSON.parse(data)) as M)
    },
    write(data: M) {
      return Promise.resolve(JSON.stringify(data.toJSON()))
    },
  })
}

export function createPageQueryCache<M extends Model>(
  OModel: typeof Model,
  query: QueryBuilder<M, Page<M>>,
  prefix: string = 'db'
): Cache<Page<M>> {
  const { bindings, sql } = query.toKnexQuery().toSQL()
  return createCache(`${prefix}_${sql}:${bindings}`, {
    async fetch() {
      return await query.execute()
    },
    read(data: string) {
      const pg = JSON.parse(data) as { total: number; results: any[] }
      pg.results = pg.results.map((value) => OModel.fromJson(value))
      return Promise.resolve(pg as Page<M>)
    },
    write(data: Page<M>) {
      return Promise.resolve(
        JSON.stringify({
          results: data.results.map((v) => v.toJSON()),
          total: data.total,
        })
      )
    },
  })
}
