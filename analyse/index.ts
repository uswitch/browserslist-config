import ingestCSVs from './ingest-csvs'
import outputCSV from './output-csv'
import { FormattedRecord } from './types'

const { DATASET } = process.env
const TARGET_PERCENTILE = Number(process.env.TARGET_PERCENTILE || 99)
const INJECTED_PROPOSED_SUPORT_TABLE = process.env.SUPPORT_TABLE
  ? JSON.parse(process.env.SUPPORT_TABLE)
  : null

const totalSessionsIn = (recordList: FormattedRecord[]) =>
  recordList.reduce((currentTotal, record) => currentTotal + record.sessions, 0)

const takePercentile = (
  percentage: number,
  records: FormattedRecord[],
  exclude?: RegExp,
) => {
  const totalSessions = totalSessionsIn(records)

  const target = (totalSessions / 100) * percentage
  const res = records.reduce(
    (acc, record) => {
      const newSumOfSessions = acc.sessions + record.sessions

      if (
        exclude?.test(record.browser) ||
        !record.sessions ||
        newSumOfSessions >= target
      ) {
        return acc
      } else {
        return {
          records: [...acc.records, record],
          sessions: newSumOfSessions,
        }
      }
    },
    { records: [] as FormattedRecord[], sessions: 0 },
  )
  console.log(
    `after exclusions, took ${res.sessions} sessions which is ${
      target - res.sessions
    } less than  the target ${target} and ${
      totalSessions - res.sessions
    } less than the total, ${totalSessions}`,
  )
  return res.records
}

const pickOldestVersion = (
  first: string,
  second: string,
  depth = 0,
): string => {
  const isTie =
    first.split('.')[depth] === undefined &&
    second.split('.')[depth] == undefined
  if (isTie) {
    return first
  }

  const firstsVersionAtThisDepth = Number(first.split('.')[depth] || 0)
  const secondsVersionAtThisDepth = Number(second.split('.')[depth] || 0)

  if (firstsVersionAtThisDepth < secondsVersionAtThisDepth) {
    return first
  }

  if (firstsVersionAtThisDepth > secondsVersionAtThisDepth) {
    return second
  }

  return pickOldestVersion(first, second, depth + 1)
}

const getSupportTable = (records: FormattedRecord[]) => {
  if (INJECTED_PROPOSED_SUPORT_TABLE) {
    return INJECTED_PROPOSED_SUPORT_TABLE
  }
  return records.reduce((supportTable, record) => {
    const lastBrowserVersionDetected: string | undefined =
      supportTable[record.browser]

    if (!lastBrowserVersionDetected) {
      return { ...supportTable, [record.browser]: record['browser version'] }
    } else {
      return {
        ...supportTable,
        [record.browser]: pickOldestVersion(
          record['browser version'],
          lastBrowserVersionDetected,
        ),
      }
    }
  }, {} as Record<string, string>)
}

const getSupportTableSessionPercentage = (
  allRecords: FormattedRecord[],
  supportTable: Record<string, string>,
) => {
  const numberOfSessionsInSupportTable = Object.entries(supportTable)
    .map(([browserName, browserMinimumVersion]) => {
      const browsersThisVersionOrHigher = allRecords.filter(record => {
        if (record.browser !== browserName) {
          return false
        }

        const oldestVersion = pickOldestVersion(
          browserMinimumVersion,
          record['browser version'],
        )

        return oldestVersion === browserMinimumVersion
      })
      return totalSessionsIn(browsersThisVersionOrHigher)
    })
    .reduce((total, sessions) => total + sessions)

  const totalSessions = totalSessionsIn(allRecords)
  return (numberOfSessionsInSupportTable / totalSessions) * 100
}

const generateReport = () => {
  if (typeof DATASET !== 'string') {
    throw new Error('DATASET environment variable is required')
  }
  const allRecords = ingestCSVs(DATASET).sort((a, b) => b.sessions - a.sessions)

  const bestRecords = takePercentile(
    TARGET_PERCENTILE,
    allRecords,
    /explorer|silk|opera|uc browser|mozilla compatible agent/i,
  )

  outputCSV('formatted-all', allRecords)
  outputCSV(`formatted-${TARGET_PERCENTILE}-percentile.csv`, bestRecords)

  const supportTable = getSupportTable(bestRecords)
  const supportTableSupports = getSupportTableSessionPercentage(
    allRecords,
    supportTable,
  )

  return {
    supportTable,
    machineFriendlySupportTable: JSON.stringify(supportTable),
    supportTableSupports: `${supportTableSupports.toFixed(3)}% of sessions`,
  }
}

const report = generateReport()
console.log(report)
