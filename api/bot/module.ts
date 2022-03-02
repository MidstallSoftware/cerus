import { Config } from './context'
import BotInstance from '.'

export interface Module {
  config: Config
  instance: BotInstance
}

export type ModuleWrapper = (mod: Module) => object

export interface ModuleConfig {
  name: string
  requiresPremium?: boolean
}

export interface ModuleFactory extends ModuleConfig {
  wrapper(instance: BotInstance, config: Config): object
}

export function definedModule(
  config: ModuleConfig,
  wrapper: ModuleWrapper
): ModuleFactory {
  return {
    ...config,
    wrapper(instance: BotInstance, config: Config): object {
      const self: Module = {
        config,
        instance,
      }
      return wrapper.call(self, self)
    },
  }
}

export default definedModule
