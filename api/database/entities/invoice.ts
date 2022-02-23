import { Model } from 'objection'
import User from './user'

export default class Invoice extends Model {
  id!: number
  user!: User
  date!: Date
  totalAmount!: number
  totalCalls!: number
  totalCommands!: number
  paid!: boolean

  static tableName = 'invoices'
}
