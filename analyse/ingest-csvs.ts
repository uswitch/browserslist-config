import fs from 'fs'
import { RawRecord } from './types'
import csv from 'csv/sync'
import { makePath } from './shared'

const readCsvFile = (filepath: string) => {
  const file = fs.readFileSync(filepath, 'utf-8')
  const contents: RawRecord[] = csv.parse(file, { bom: true, columns: true })
  return contents
}

const formatRecords = (rawRecords: RawRecord[]) => {
  return rawRecords
    .map(record => {
      const sessions = Number(record.Sessions.replace(/,/g, ''))

      const out = {
        browser: record.Browser,
        'browser version': record['Browser version'],
        'browser major version': record['Browser version'].replace(/\..*/, ''),
        sessions,
      }
      return out
    })
    .filter(browser => browser['browser major version'] !== '(not set)')
}

const ingestCSVs = (dataset: string) => {
  const datasetFiles = fs.readdirSync(makePath('sources', dataset))
  const csvs = datasetFiles.flatMap(filename =>
    readCsvFile(makePath('sources', dataset, filename)),
  )
  const formattedRecords = formatRecords(csvs)
  return formattedRecords
}

export default ingestCSVs
