import Mail from 'nodemailer/lib/mailer'
import { DI } from '../../di'
import { definedModule } from '../module'

export default definedModule(
  {
    name: 'mail',
    requiresPremium: true,
  },
  (mod) => {
    return {
      async send(opts: Mail.Options) {
        const user = await mod.instance.entry.fetch()
        const subject = opts.subject
        opts.subject =
          `Cerus Bot ${user.username}` + (subject ? ` - ${subject}` : '')
        DI.mail.sendRaw(opts)
      },
      async templated(opts: Mail.Options) {
        const user = await mod.instance.entry.fetch()
        const subject = opts.subject
        opts.subject =
          `Cerus Bot ${user.username}` + (subject ? ` - ${subject}` : '')
        DI.mail.sendTemplated(opts)
      },
    }
  }
)
