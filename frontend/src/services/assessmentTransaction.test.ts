import { describe, expect, it } from 'vitest'
import { INITIAL_TRANSACTIONS } from './mockData'
import { getAssessmentTransactionStatus } from './assessmentTransaction'

describe('on-chain assessment transaction status', () => {
  it('reports pending only when no receipt is available', () => {
    expect(getAssessmentTransactionStatus(null)).toBe('pending')
  })

  it('reports the status encoded by a mined receipt', () => {
    expect(getAssessmentTransactionStatus(1)).toBe('success')
    expect(getAssessmentTransactionStatus(0)).toBe('failed')
  })

  it('rejects unknown receipt statuses instead of guessing', () => {
    expect(() => getAssessmentTransactionStatus(2)).toThrow(/Unexpected transaction receipt status/)
  })

  it('keeps demo transfer records explicitly simulated without fabricated chain hashes', () => {
    expect(INITIAL_TRANSACTIONS.length).toBeGreaterThan(0)
    for (const transaction of INITIAL_TRANSACTIONS) {
      expect(transaction.isDemo).toBe(true)
      expect(transaction.sourceTxHash).toBe('')
      expect(transaction.destinationTxHash).toBe('')
      expect(transaction.stages.every((stage) => stage.txHash === undefined)).toBe(true)
    }
  })
})