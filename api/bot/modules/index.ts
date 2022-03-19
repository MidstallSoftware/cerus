import { ModuleFactory } from '../module'
import cache from './cache'
import datastore from './datastore'

const modules: ModuleFactory[] = [cache, datastore]

export default {
  all: modules,
  free: modules.filter((mod) => !mod.requiresPremium),
  premium: modules.filter((mod) => mod.requiresPremium),
}
