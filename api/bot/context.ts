import { LuaFactory, LuaLibraries } from 'wasmoon'
import modules from './modules'
import BotInstance from '.'

export type ContextType = 'command' | 'message'

export interface Config {
  premium: boolean
  type: ContextType
  globals?: Record<any, any>
  print(...args: any[]): void
}

export async function defineContext(
  bot: BotInstance,
  code: string,
  config: Config
): Promise<any> {
  const factory = new LuaFactory()
  const engine = await factory.createEngine({
    openStandardLibs: false,
  })

  try {
    engine.global.loadLibrary(LuaLibraries.Coroutine)
    engine.global.loadLibrary(LuaLibraries.Math)
    engine.global.loadLibrary(LuaLibraries.String)
    engine.global.loadLibrary(LuaLibraries.Table)
    engine.global.loadLibrary(LuaLibraries.UTF8)

    engine.global.set('print', config.print)

    if (typeof config.globals === 'object') {
      for (const key in config.globals) {
        engine.global.set(key, config.globals[key])
      }
    }

    if (config.premium) {
      engine.global.loadLibrary(LuaLibraries.IO)

      for (const mod of modules.premium) {
        engine.global.set(mod.name, mod.wrapper(bot, config))
      }
    }

    for (const mod of modules.free) {
      engine.global.set(mod.name, mod.wrapper(bot, config))
    }
    return engine.doString(code)
  } finally {
    engine.global.close()
  }
}

export default defineContext
