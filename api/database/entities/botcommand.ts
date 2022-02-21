import {
  Entity,
  Property,
  Unique,
  PrimaryKey,
  SerializedPrimaryKey,
  ManyToOne,
} from '@mikro-orm/core'
import Bot from './bot'

@Entity()
export default class BotCommand {
  @PrimaryKey()
  _id!: number

  @SerializedPrimaryKey()
  id!: number

  @Property()
  @Unique()
  name: string

  @Property()
  code: string

  @ManyToOne()
  bot!: Bot

  constructor(name: string, code: string) {
    this.name = name
    this.code = code
  }
}
