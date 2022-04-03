import { readFileSync } from 'fs'
import { join } from 'path'
import mjml from 'mjml'
import { createTransport } from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

const env = process.env.NODE_ENV || 'development'
const production = env === 'production'

const templateDir = join(__dirname, '..', 'mails')

export interface Mailer {
  send(
    to: string,
    subject: string,
    templateId: string,
    vars?: Record<string, any>
  ): Promise<void>
  sendRaw(opts: Mail.Options): Promise<void>
  sendTemplated(opts: Mail.Options): Promise<void>
}

export async function initMail(): Promise<Mailer> {
  const hasAuth = process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD
  const transport = createTransport(
    process.env.EMAIL_URL || {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      auth: hasAuth
        ? {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
          }
        : undefined,
      debug: !production,
    }
  )
  await transport.verify()

  return {
    send: async (to, subject, templateId, vars) => {
      const templateSource = readFileSync(
        join(templateDir, `${templateId}.mjml`),
        'utf-8'
      )
      let { html } = mjml(templateSource, { validationLevel: 'strict' })
      if (vars) {
        for (const key in vars) {
          html = html.split('${' + key + '}').join(vars[key])
        }
      }
      const msg = {
        from: 'noreply@cerus.com',
        /* eslint-disable no-template-curly-in-string */
        html: html
          .split('${subject}')
          .join(subject)
          .split('${baseUrl}')
          .join(process.env.BROWSER_BASE_URL || 'http://localhost:8087'),
        to,
        subject,
      }
      await transport.sendMail(msg)
    },
    sendRaw: async (opts) => {
      await transport.sendMail(opts)
    },
    sendTemplated: async (opts) => {
      if (typeof opts.html !== 'string')
        throw new Error('opts.html must be a string')

      opts.html = mjml(opts.html, { validationLevel: 'strict' }).html
      await transport.sendMail(opts)
    },
  }
}
