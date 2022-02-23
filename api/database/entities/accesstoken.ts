import { Model } from 'objection'

export default class AccessToken extends Model {
  token!: string
  refresh!: string
  type!: string
  scope!: string
  userId!: number
  expires!: Date

  static tableName = 'accessTokens'
}
