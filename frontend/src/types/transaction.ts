export type StageId =
  | 'source_initiated'
  | 'relayer_inflight'
  | 'destination_executed'
  | 'finalized'

export type TransactionStatus = 'in_progress' | 'completed' | 'flagged'

export interface StageDetail {
  id: StageId
  title: string
  description: string
  chain: string
  txHash?: string
  completedAt?: string
  isSimulated: boolean
}

export interface ActivityLog {
  timestamp: string
  stage: StageId
  message: string
  type: 'info' | 'success' | 'warning'
}

export interface TrackedTransaction {
  id: string
  routeId: number
  routeName: string
  protocol: string
  fromChain: string
  toChain: string
  amount: string
  token: string
  estimatedFeeUsd: number
  destinationAddress: string
  status: TransactionStatus
  currentStage: StageId
  progressPercent: number
  createdAt: string
  updatedAt: string
  sourceTxHash: string
  destinationTxHash: string
  stages: StageDetail[]
  logs: ActivityLog[]
  isDemo: true
}
