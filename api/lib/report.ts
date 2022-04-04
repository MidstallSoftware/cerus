import BotReport from '../database/entities/botreport'
import { APIReport } from '../types'
import { fixDate } from '../utils'

export function transformReport(report: BotReport): APIReport {
  return {
    id: report.id,
    botId: report.botId,
    type: report.type,
    title: report.title,
    content: report.content,
    attachments: report.attachments,
    created: fixDate(report.createdAt),
    resolved: report.resolved,
  }
}
