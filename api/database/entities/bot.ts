import {
  Entity,
  Property,
  Unique,
  PrimaryKey,
  SerializedPrimaryKey,
  OneToMany,
  Collection,
} from '@mikro-orm/core'
import BotCommand from './botcommand'

@Entity()
export default class Bot {
  @PrimaryKey()
  _id!: number

  @SerializedPrimaryKey()
  id!: number

  @Property()
  @Unique()
  discordToken!: string

  @Property()
  discordOwner!: string

  @OneToMany({ entity: () => BotCommand, mappedBy: 'bot', orphanRemoval: true })
  commands!: Collection<BotCommand>

  constructor(token: string, owner: string) {
    this.discordToken = token
    this.discordOwner = owner
    this.commands = new Collection<BotCommand>(this)
  }
}
