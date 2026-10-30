import type { Route } from '../types/route'
import type { ActivityLog, StageDetail, StageId, TrackedTransaction, TransactionStatus } from '../types/transaction'
import { calculateRouteFees } from './feeCalculator'
import { createTransactionId } from './transactionId'

export const SIMULATED_STAGE_SEQUENCE: readonly StageId[] = [
  'source_initiated',
  'relayer_inflight',
  'destination_executed',
  'finalized',
]

export const SIMULATED_STAGE_TITLES: Record<StageId, string> = {
  source_initiated: 'Source Chain Deposit',
  relayer_inflight: 'Relayer Attestation',
  destination_executed: 'Destination Execution',
  finalized: 'Final Settlement',
}

export type TransactionStatusFilter = 'all' | TransactionStatus

function createSimulatedStages(route: Route, amount: string): StageDetail[] {
  return [
    {
      id: 'source_initiated',
      title: SIMULATED_STAGE_TITLES.source_initiated,
      description: `Simulated deposit step for ${amount} ${route.fromToken} on ${route.fromChain}; no blockchain transaction was sent.`,
      chain: route.fromChain,
      isSimulated: true,
    },
    {
      id: 'relayer_inflight',
      title: SIMULATED_STAGE_TITLES.relayer_inflight,
      description: 'Simulated attestation progress; no external relayer was contacted.',
      chain: 'Simulated Relayer',
      isSimulated: true,
    },
    {
      id: 'destination_executed',
      title: SIMULATED_STAGE_TITLES.destination_executed,
      description: `Simulated destination execution on ${route.toChain}; no destination transaction was sent.`,
      chain: route.toChain,
      isSimulated: true,
    },
    {
      id: 'finalized',
      title: SIMULATED_STAGE_TITLES.finalized,
      description: 'Simulated final settlement; no on-chain settlement occurred.',
      chain: 'Simulation',
      isSimulated: true,
    },
  ]
}

export function createSimulatedTransaction(
  route: Route,
  requestedAmount: string,
  destinationAddress: string,
  existingTransactions: readonly Pick<TrackedTransaction, 'id'>[],
): TrackedTransaction {
  const amount = requestedAmount || '0.1'
  const fees = calculateRouteFees(route, amount)

  return {
    id: createTransactionId(existingTransactions),
    routeId: route.id,
    routeName: route.name,
    protocol: route.protocolName,
    fromChain: route.fromChain,
    toChain: route.toChain,
    amount,
    token: route.fromToken,
    estimatedFeeUsd: fees.totalFeeUsd,
    destinationAddress: destinationAddress.trim() || '0x71C...49b2',
    status: 'in_progress',
    currentStage: 'source_initiated',
    progressPercent: 25,
    createdAt: 'Just now',
    updatedAt: 'Just now',
    sourceTxHash: '',
    destinationTxHash: '',
    isDemo: true,
    stages: createSimulatedStages(route, amount),
    logs: [
      {
        timestamp: 'Just now',
        stage: 'source_initiated',
        message: `Simulated transfer initialized via ${route.name}; no blockchain transaction was sent. Estimated fee: $${fees.totalFeeUsd}`,
        type: 'info',
      },
    ],
  }
}

const stageProgress: Record<StageId, number> = {
  source_initiated: 25,
  relayer_inflight: 50,
  destination_executed: 75,
  finalized: 100,
}

const stageMessages: Record<StageId, string> = {
  source_initiated: 'Simulated source deposit step completed; no blockchain transaction was sent.',
  relayer_inflight: 'Simulated relayer attestation completed; no external relayer was contacted.',
  destination_executed: 'Simulated destination execution completed; no destination transaction was sent.',
  finalized: 'Simulated final settlement completed; no on-chain settlement occurred.',
}

export function advanceSimulatedTransaction(
  transaction: TrackedTransaction,
  updatedAt = 'Just now',
): TrackedTransaction | null {
  if (!transaction.isDemo || transaction.status !== 'in_progress') return null

  const currentIndex = SIMULATED_STAGE_SEQUENCE.indexOf(transaction.currentStage)
  if (currentIndex < 0 || currentIndex >= SIMULATED_STAGE_SEQUENCE.length - 1) return null

  const nextStage = SIMULATED_STAGE_SEQUENCE[currentIndex + 1]
  const isComplete = nextStage === 'finalized'
  const nextIndex = SIMULATED_STAGE_SEQUENCE.indexOf(nextStage)
  const stages = transaction.stages.map((stage) => {
    const stageIndex = SIMULATED_STAGE_SEQUENCE.indexOf(stage.id)
    if (stageIndex < 0 || stageIndex > nextIndex || (stageIndex === nextIndex && !isComplete)) return stage
    return { ...stage, completedAt: updatedAt }
  })

  const log: ActivityLog = {
    timestamp: updatedAt,
    stage: nextStage,
    message: stageMessages[nextStage],
    type: isComplete ? 'success' : 'info',
  }

  return {
    ...transaction,
    currentStage: nextStage,
    progressPercent: stageProgress[nextStage],
    status: isComplete ? 'completed' : 'in_progress',
    updatedAt,
    stages,
    logs: [log, ...transaction.logs],
  }
}

export function getTransactionStatusLabel(status: TransactionStatus): string {
  if (status === 'in_progress') return '● In-Flight'
  if (status === 'flagged') return '⚠ Flagged'
  return '✓ Finalized'
}

export function filterSimulatedTransactions(
  transactions: readonly TrackedTransaction[],
  statusFilter: TransactionStatusFilter,
  query: string,
): TrackedTransaction[] {
  const normalizedQuery = query.trim().toLowerCase()

  return transactions.filter((transaction) => {
    if (!transaction.isDemo) return false
    if (statusFilter !== 'all' && transaction.status !== statusFilter) return false
    if (!normalizedQuery) return true

    const searchableText = [
      transaction.id,
      transaction.routeName,
      transaction.protocol,
      transaction.fromChain,
      transaction.toChain,
      transaction.sourceTxHash,
      transaction.destinationTxHash,
      transaction.destinationAddress,
      transaction.currentStage,
      ...transaction.stages.flatMap((stage) => [stage.title, stage.description]),
      ...transaction.logs.map((log) => log.message),
    ].join(' ').toLowerCase()

    return searchableText.includes(normalizedQuery)
  })
}