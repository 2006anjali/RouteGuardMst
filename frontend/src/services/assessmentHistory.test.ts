import { describe, expect, it, vi } from 'vitest'
import type { OnChainAssessmentRecord } from '../types/assessment'
import {
  fetchAssessmentHistory,
  getLatestAssessmentRecord,
  type AssessmentHistoryReader,
} from './assessmentHistory'

const assessmentOne: OnChainAssessmentRecord = {
  id: '1',
  routeName: 'Route One',
  riskScore: 25,
  approved: true,
  reportHash: 'report-one',
  assessor: '0x1111111111111111111111111111111111111111',
  timestamp: '1760000000',
  transactionHash: null,
}

const assessmentTwo: OnChainAssessmentRecord = {
  ...assessmentOne,
  id: '2',
  routeName: 'Route Two',
  riskScore: 60,
  approved: false,
  reportHash: 'report-two',
}

function makeReader(overrides: Partial<AssessmentHistoryReader> = {}): AssessmentHistoryReader {
  return {
    readNextAssessmentId: vi.fn().mockResolvedValue(3n),
    readAssessment: vi.fn(async (id: bigint) => id === 1n ? assessmentOne : assessmentTwo),
    readAssessmentEvents: vi.fn().mockResolvedValue([
      { id: '1', transactionHash: '0x' + 'a'.repeat(64), blockNumber: 100 },
      { id: '2', transactionHash: '0x' + 'b'.repeat(64), blockNumber: 200 },
    ]),
    close: vi.fn(),
    ...overrides,
  }
}

describe('on-chain assessment history', () => {
  it('reads mapping records and associates their indexed event transaction hashes', async () => {
    const reader = makeReader()
    const records = await fetchAssessmentHistory(() => reader)

    expect(records).toEqual([
      { ...assessmentTwo, transactionHash: '0x' + 'b'.repeat(64), blockNumber: 200 },
      { ...assessmentOne, transactionHash: '0x' + 'a'.repeat(64), blockNumber: 100 },
    ])
    expect(reader.readAssessment).toHaveBeenCalledTimes(2)
    expect(reader.close).toHaveBeenCalledOnce()
  })

  it('selects the latest record from the newest-first history result', async () => {
    const records = await fetchAssessmentHistory(() => makeReader())

    expect(getLatestAssessmentRecord(records)).toMatchObject({
      id: '2',
      routeName: 'Route Two',
      transactionHash: '0x' + 'b'.repeat(64),
      blockNumber: 200,
    })
  })

  it('returns an empty list when nextAssessmentId indicates no records', async () => {
    const reader = makeReader({ readNextAssessmentId: vi.fn().mockResolvedValue(1n) })

    await expect(fetchAssessmentHistory(() => reader)).resolves.toEqual([])
    expect(getLatestAssessmentRecord([])).toBeNull()
    expect(reader.readAssessment).not.toHaveBeenCalled()
    expect(reader.close).toHaveBeenCalledOnce()
  })

  it('surfaces mapping RPC failures and still closes the reader', async () => {
    const reader = makeReader({
      readAssessment: vi.fn().mockRejectedValue(new Error('RPC unavailable')),
    })

    await expect(fetchAssessmentHistory(() => reader)).rejects.toThrow('RPC unavailable')
    expect(reader.close).toHaveBeenCalledOnce()
  })

  it('keeps mapping history when event logs cannot be queried', async () => {
    const reader = makeReader({
      readAssessmentEvents: vi.fn().mockRejectedValue(new Error('Historical logs unavailable')),
    })

    const records = await fetchAssessmentHistory(() => reader)
    expect(records).toHaveLength(2)
    expect(records.every((record) => record.transactionHash === null)).toBe(true)
    expect(records.every((record) => record.blockNumber === null)).toBe(true)
  })
})