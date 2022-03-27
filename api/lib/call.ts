import { Workbook, CellValue, AddWorksheetOptions } from 'exceljs'
import BotCall from '../database/entities/botcall'
import { fixDate } from '../utils'
import { APIInteractionCall } from '../types'

export function transformCall(call: BotCall): APIInteractionCall {
  return {
    id: call.id,
    result: call.result,
    error: call.errors,
    message: call.messages,
    callerId: call.callerId,
    timestamp: fixDate(call.dateTime),
    failed: call.failed,
    guildId: call.guildId,
    channelId: call.channelId,
  }
}

export function exportCalls(
  calls: APIInteractionCall[],
  opts: Partial<AddWorksheetOptions>
): Workbook {
  const workbook = new Workbook()
  workbook.creator = 'Cerus'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Stats', opts)

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10, font: { bold: true } },
    {
      header: 'Caller ID',
      key: 'caller',
      width: 25,
      font: { bold: true },
    },
    {
      header: 'Timestamp',
      key: 'timestamp',
      width: 20,
      style: {
        numFmt: 'yyyy-mm-dd hh:mm:ss',
      },
      font: { bold: true },
    },
    {
      header: 'Failed',
      key: 'failed',
      width: 5,
      font: { bold: true },
    },
    {
      header: 'Message',
      key: 'message',
    },
    {
      header: 'Errors',
      key: 'errors',
    },
    {
      header: 'Response',
      key: 'response',
    },
  ]

  for (const call of calls) {
    sheet.addRow({
      id: call.id,
      caller: call.callerId,
      timestamp: call.timestamp,
      failed: call.failed.toString(),
      message: call.message,
      errors: call.error,
      result: call.result,
    })
  }

  const nextRow = sheet.lastRow.number + 1

  sheet.getCell(`A${nextRow}`).value = 'Total Calls'
  sheet.getCell(`A${nextRow}`).style = {
    font: {
      bold: true,
    },
  }
  sheet.getCell(`B${nextRow}`).value = {
    formula: `COUNT(A2:A${nextRow - 2})`,
    result: (calls as APIInteractionCall[]).length,
  } as CellValue

  sheet.getCell(`C${nextRow}`).value = 'Cost Per Call'
  sheet.getCell(`C${nextRow}`).style = {
    font: {
      bold: true,
    },
  }
  sheet.getCell(`D${nextRow}`).value = '0.05'
  sheet.getCell(`D${nextRow}`).style = {
    numFmt: '$0.00',
  }

  sheet.getCell(`E${nextRow}`).value = 'Total Cost'
  sheet.getCell(`E${nextRow}`).style = {
    font: {
      bold: true,
    },
  }

  sheet.getCell(`F${nextRow}`).value = {
    formula: `B${nextRow} * D${nextRow}`,
    result: calls.length * 0.05,
  } as CellValue
  sheet.getCell(`F${nextRow}`).style = {
    numFmt: '$0.00',
  }
  return workbook
}
