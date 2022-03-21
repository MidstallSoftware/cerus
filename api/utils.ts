import { NextFunction, Request, Response } from 'express'
import { Model, Page, QueryBuilder } from 'objection'
import { DI } from './di'
import { HttpNotFoundError } from './exceptions'
import { BaseMessage } from './message'
import winston from './providers/winston'

const CACHE_EXPIRE_TIME = 30

export function getInt(
  str?: string | undefined | null,
  def: number = 0
): number {
  const v = parseInt(str)
  if (isNaN(v)) return def
  return v
}

export function fixDate(dt: number | string | Date) {
  if (dt instanceof Date) return dt
  if (typeof dt === 'string') return new Date(dt)

  const d = new Date()
  d.setTime(dt)
  return d
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
      EX: CACHE_EXPIRE_TIME,
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
    EX: CACHE_EXPIRE_TIME,
  })
}

export interface Cache<T> {
  write(data: T): Promise<void>
  read(): Promise<T>
  invalidate(): Promise<boolean>
}

export function createCache<T>(key: string, opts: CacheOptions<T>): Cache<T> {
  return {
    write(data: T): Promise<void> {
      return setCache(key, data, opts)
    },
    read(): Promise<T> {
      return getCache(key, opts)
    },
    async invalidate(): Promise<boolean> {
      return (await DI.redis.del(key)) > 0
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
      const v = await query.execute()
      if (v === undefined || v === null)
        throw new HttpNotFoundError('Query returned no results')
      return v
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
      const v = await query.execute()
      if (v === undefined || v === null)
        throw new HttpNotFoundError('Query returned no results')
      return v
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
      const v = await query.execute()
      if (v === undefined || v === null)
        throw new HttpNotFoundError('Query returned no results')
      return v
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

export type ResponseCacheWriter = (
  req: Request,
  res: Response,
  next: NextFunction
) => BaseMessage | Promise<BaseMessage>

export function sendCachedResponse(writer: ResponseCacheWriter) {
  return async function send(req: Request, res: Response, next: NextFunction) {
    const key = JSON.stringify({
      auth: req.headers.authorization || false,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      url: req.originalUrl,
    })

    try {
      const value = await getCache(key, {
        fetch() {
          try {
            const w = writer(req, res, next)
            if (w instanceof BaseMessage) return Promise.resolve(w)
            return w
          } catch (e) {
            return null
          }
        },
        read(data: string) {
          return Promise.resolve(JSON.parse(data) as BaseMessage)
        },
        write(data: BaseMessage) {
          return Promise.resolve(JSON.stringify(data.toJSON()))
        },
      })
      res.json(value)
    } catch (e) {
      next(e)
    }
  }
}
