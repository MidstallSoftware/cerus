import { ModuleFactory } from '../module'
import cache from './cache'
import datastore from './datastore'
import mail from './mail'

const modules: ModuleFactory[] = [cache, datastore, mail]

export default {
  all: modules,
  free: modules.filter((mod) => !mod.requiresPremium),
  premium: modules.filter((mod) => mod.requiresPremium),
}
