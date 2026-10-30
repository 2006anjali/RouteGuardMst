import { describe, expect, it, vi } from 'vitest'
import { DEMO_ROUTES, INITIAL_TRANSACTIONS } from './mockData'
import { createTransactionId } from './transactionId'
import {
  advanceSimulatedTransaction,
  createSimulatedTransaction,
  filterSimulatedTransactions,
  getTransactionStatusLabel,
  SIMULATED_STAGE_TITLES,
} from './simulatedTransactions'

describe('simulated transaction lifecycle', () => {
  it('starts in-flight at 25% with four simulated stages and no blockchain hashes', () => {
    const transaction = createSimulatedTransaction(DEMO_ROUTES[0], '0.2', '', INITIAL_TRANSACTIONS)

    expect(transaction.status).toBe('in_progress')
    expect(transaction.progressPercent).toBe(25)
    expect(transaction.currentStage).toBe('source_initiated')
    expect(transaction.stages.map((stage) => stage.title)).toEqual([
      'Source Chain Deposit',
      'Relayer Attestation',
      'Destination Execution',
      'Final Settlement',
    ])
    expect(transaction.stages.every((stage) => stage.isSimulated && !stage.completedAt && !stage.txHash)).toBe(true)
    expect(transaction.sourceTxHash).toBe('')
    expect(transaction.destinationTxHash).toBe('')
    expect(transaction.isDemo).toBe(true)
    expect(transaction.stages[0].completedAt).toBeUndefined()
    expect(INITIAL_TRANSACTIONS.some((existing) => existing.id === transaction.id)).toBe(false)
  })

  it('advances consistently through 25, 50, 75 and 100 percent before completing', () => {
    let transaction = createSimulatedTransaction(DEMO_ROUTES[0], '0.1', '', [])
    const progression = [transaction.progressPercent]

    for (const updatedAt of ['Step 2', 'Step 3', 'Step 4']) {
      const next = advanceSimulatedTransaction(transaction, updatedAt)
      expect(next).not.toBeNull()
      transaction = next!
      progression.push(transaction.progressPercent)
      if (transaction.status === 'in_progress') {
        const currentStage = transaction.stages.find((stage) => stage.id === transaction.currentStage)
        expect(currentStage?.completedAt).toBeUndefined()
      }
    }

    expect(progression).toEqual([25, 50, 75, 100])
    expect(transaction.status).toBe('completed')
    expect(transaction.currentStage).toBe('finalized')
    expect(transaction.stages.every((stage) => stage.completedAt !== undefined)).toBe(true)
    expect(advanceSimulatedTransaction(transaction)).toBeNull()
    expect(transaction.sourceTxHash).toBe('')
    expect(transaction.destinationTxHash).toBe('')
  })

  it('does not advance real or already completed records', () => {
    const transaction = createSimulatedTransaction(DEMO_ROUTES[0], '0.1', '', [])
    expect(advanceSimulatedTransaction({ ...transaction, status: 'completed' })).toBeNull()

  })

  it('filters by status and searches route, protocol, destination and transaction ID', () => {
    const inProgress = createSimulatedTransaction(DEMO_ROUTES[0], '0.1', '0xabc123', INITIAL_TRANSACTIONS)
    const flagged = { ...INITIAL_TRANSACTIONS[0], status: 'flagged' as const }
    const records = [...INITIAL_TRANSACTIONS, inProgress, flagged]

    expect(filterSimulatedTransactions(records, 'in_progress', 'Across Intent Relayers')).toEqual([INITIAL_TRANSACTIONS[1]])
    expect(filterSimulatedTransactions(records, 'in_progress', 'Arbitrum Canonical Bridge')).toEqual([inProgress])
    expect(filterSimulatedTransactions(records, 'all', '0xabc123')).toEqual([inProgress])
    expect(filterSimulatedTransactions(records, 'all', 'Final Settlement').map(({ id }) => id)).toEqual([INITIAL_TRANSACTIONS[0].id, INITIAL_TRANSACTIONS[1].id, inProgress.id, flagged.id])
    expect(filterSimulatedTransactions(records, 'flagged', '')).toEqual([flagged])
    expect(filterSimulatedTransactions(records, 'all', 'not found')).toEqual([])
  })

  it('labels flagged records accurately instead of presenting them as finalized', () => {
    expect(getTransactionStatusLabel('flagged')).toContain('Flagged')
    expect(getTransactionStatusLabel('in_progress')).toContain('In-Flight')
    expect(getTransactionStatusLabel('completed')).toContain('Finalized')
  })

  it('produces a distinct ID when the random base and first suffix are occupied', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    try {
      const generated = createTransactionId([
        { id: 'tx-rg-1000' },
        { id: 'tx-rg-1000-1' },
      ])
      expect(['tx-rg-1000', 'tx-rg-1000-1']).not.toContain(generated)
    } finally {
      random.mockRestore()
    }
  })

  it('defines all required lifecycle labels', () => {
    expect(Object.values(SIMULATED_STAGE_TITLES)).toHaveLength(4)
  })
})