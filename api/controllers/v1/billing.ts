import { NextFunction, Request, Response } from 'express'
import Stripe from 'stripe'
import { BaseMessage } from '../../message'
import { DI } from '../../di'
import Bot from '../../database/entities/bot'
import BotCommand from '../../database/entities/botcommand'
import User from '../../database/entities/user'
import winston from '../../providers/winston'

export default function () {
  return {
    checkout: (req: Request, res: Response, next: NextFunction) => {
      try {
        const user: User = res.locals.auth.user
        DI.stripe.prices
          .list({
            lookup_keys: [req.body.lookup_key],
            expand: ['data.product'],
          })
          .then(async (prices) => {
            const product =
              typeof prices.data[0].product === 'string'
                ? await DI.stripe.products.retrieve(prices.data[0].product)
                : (prices.data[0].product as Stripe.Product)
            const ourPrice = await DI.stripe.prices.create({
              product: product.id,
              unit_amount: prices.data[0].unit_amount,
              billing_scheme: prices.data[0].billing_scheme,
              currency: prices.data[0].currency,
              recurring: {
                usage_type: prices.data[0].recurring.usage_type,
                aggregate_usage:
                  (prices.data[0].recurring.aggregate_usage || '').length > 0
                    ? prices.data[0].recurring.aggregate_usage
                    : undefined,
                trial_period_days:
                  parseInt(
                    (
                      prices.data[0].recurring.trial_period_days || ''
                    ).toString()
                  ) || 0,
                interval_count:
                  parseInt(
                    (prices.data[0].recurring.interval_count || '').toString()
                  ) || 0,
                interval: prices.data[0].recurring.interval,
              },
              metadata: {
                id: req.body.id,
                type: req.body.type,
              },
            })
            return await DI.stripe.checkout.sessions.create({
              customer: user.customerId,
              billing_address_collection: 'auto',
              metadata: {
                type: req.body.type,
                id: req.body.id as number,
              },
              line_items: [
                {
                  price: ourPrice.id,
                  quantity:
                    prices.data[0].recurring.usage_type === 'metered'
                      ? undefined
                      : 1,
                },
              ],
              mode: 'subscription',
              success_url: `${req.protocol}://${
                req.hostname
              }:8087/billing/success?id={CHECKOUT_SESSION_ID}&url=${encodeURIComponent(
                req.body.url
              )}`,
              cancel_url: `${req.protocol}://${req.hostname}:8087/billing/failure`,
            })
          })
          .then((session) =>
            res.json(new BaseMessage({ url: session.url }, 'billing:checkout'))
          )
          .catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
    portal: (req: Request, res: Response, next: NextFunction) => {
      try {
        DI.stripe.checkout.sessions
          .retrieve(req.body.id)
          .then((session) =>
            DI.stripe.billingPortal.sessions.create({
              customer: session.customer as string,
              return_url: req.body.url,
            })
          )
          .then((portal) =>
            res.json(new BaseMessage({ url: portal.url }, 'billing:portal'))
          )
          .catch((e) => next(e))
      } catch (e) {
        next(e)
      }
    },
    webhook: (req: Request, res: Response, next: NextFunction) => {
      try {
        const run = async () => {
          const event: Stripe.Event =
            typeof process.env.STRIPE_WEBHOOK_SECRET === 'undefined'
              ? JSON.parse(req.body.toString())
              : DI.stripe.webhooks.constructEvent(
                  req.body,
                  req.headers['stripe-signature'],
                  process.env.STRIPE_WEBHOOK_SECRET
                )

          switch (event.type) {
            case 'customer.subscription.deleted':
              {
                const sub = event.data.object as Stripe.Subscription
                switch (sub.items.data[0].price.metadata.type) {
                  case 'bot':
                    await Bot.query()
                      .findById(
                        parseInt(sub.items.data[0].price.metadata.id.toString())
                      )
                      .patch({
                        premium: 0,
                      })
                    break
                  case 'command':
                    await BotCommand.query()
                      .findById(
                        parseInt(sub.items.data[0].price.metadata.id.toString())
                      )
                      .patch({
                        premium: 0,
                      })
                    break
                }
              }
              break
            case 'customer.subscription.created':
              {
                const sub = event.data.object as Stripe.Subscription
                switch (sub.items.data[0].price.metadata.type) {
                  case 'bot':
                    await Bot.query()
                      .findById(
                        parseInt(sub.items.data[0].price.metadata.id.toString())
                      )
                      .patch({
                        premium: 1,
                      })
                    break
                  case 'command':
                    await BotCommand.query()
                      .findById(
                        parseInt(sub.items.data[0].price.metadata.id.toString())
                      )
                      .patch({
                        premium: 1,
                      })
                    break
                }
              }
              break
            default:
              break
          }
        }
        run()
          .then(() => {
            winston.info('Webhook success')
            res.send()
          })
          .catch((e) => {
            winston.error(e)
            next(e)
          })
      } catch (e) {
        next(e)
      }
    },
  }
}
