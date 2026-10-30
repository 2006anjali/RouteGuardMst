export interface OnChainAssessmentRecord {
  id: string
  routeName: string
  riskScore: number
  approved: boolean
  reportHash: string
  assessor: string
  timestamp: string
  transactionHash: string | null
  blockNumber?: number | null
}