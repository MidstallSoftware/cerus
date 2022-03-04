import { NextFunction, Request, Response } from 'express'
import Stripe from 'stripe'
import { BaseMessage } from '../../message'
import { DI } from '../../di'
import Bot from '../../database/entities/bot'
import BotCommand from '../../database/entities/botcommand'

export default function () {
  return {
    checkout: (req: Request, res: Response, next: NextFunction) => {
      try {
        DI.stripe.prices
          .list({
            lookup_keys: [req.body.lookup_key],
            expand: ['data.product'],
          })
          .then((prices) =>
            DI.stripe.checkout.sessions.create({
              billing_address_collection: 'auto',
              metadata: {
                type: req.body.type,
                id: req.body.id as number,
              },
              line_items: [
                {
                  price: prices.data[0].id,
                  quantity: 1,
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
          )
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
              switch (sub.metadata.type) {
                case 'bot':
                  Bot.query()
                    .findById(parseInt(sub.metadata.id.toString()))
                    .patch({
                      premium: 0,
                    })
                    .then(() => res.send())
                    .catch((e) => next(e))
                  break
                case 'command':
                  BotCommand.query()
                    .findById(parseInt(sub.metadata.id.toString()))
                    .patch({
                      premium: 0,
                    })
                    .then(() => res.send())
                    .catch((e) => next(e))
                  break
              }
            }
            break
          case 'customer.subscription.created':
            {
              const sub = event.data.object as Stripe.Subscription
              switch (sub.metadata.type) {
                case 'bot':
                  Bot.query()
                    .findById(parseInt(sub.metadata.id.toString()))
                    .patch({
                      premium: 1,
                    })
                    .then(() => res.send())
                    .catch((e) => next(e))
                  break
                case 'command':
                  BotCommand.query()
                    .findById(parseInt(sub.metadata.id.toString()))
                    .patch({
                      premium: 1,
                    })
                    .then(() => res.send())
                    .catch((e) => next(e))
                  break
              }
            }
            break
          default:
            res.send()
            break
        }
      } catch (e) {
        next(e)
      }
    },
  }
}
