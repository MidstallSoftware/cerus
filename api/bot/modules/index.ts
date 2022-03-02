import { ModuleFactory } from '../module'
import cache from './cache'

const modules: ModuleFactory[] = [cache]

export default {
  all: modules,
  free: modules.filter((mod) => !mod.requiresPremium),
  premium: modules.filter((mod) => mod.requiresPremium),
}
