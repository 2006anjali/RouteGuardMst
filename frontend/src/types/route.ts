export type RiskLevel = 'Low' | 'Medium' | 'High'

export type BridgeType =
  | 'Canonical Rollup'
  | 'Intent & Relayer'
  | 'Messaging & DVN'
  | 'Liquidity Network'
  | 'Multi-Sig Custodial'

export interface AuditRecord {
  firm: string
  date: string
  reportUrl: string
  findingsCount: number
}

export interface SecurityVector {
  title: string
  score: number // 0 to 100
  rating: 'Strong' | 'Moderate' | 'Vulnerable'
  details: string
}

export interface DetailedRiskProfile {
  level: RiskLevel
  score: number // 0-100 overall security score
  summary: string
  trustModel: string
  validatorSet: string
  timelockDelay: string
  architectureType: BridgeType
  audits: AuditRecord[]
  vectors: SecurityVector[]
  exploitHistory: string
}

export interface FeeBreakdown {
  sourceGasFeeEth: number
  sourceGasFeeUsd: number
  relayerFeeUsd: number
  destinationGasFeeUsd: number
  slippageBufferUsd: number
  totalFeeUsd: number
  totalFeeEth: number
}

export interface Route {
  id: number
  name: string
  protocolName: string
  tagline: string
  fromChain: string
  toChain: string
  fromToken: string
  toToken: string
  baseEstimatedTime: string
  timeMinutes: number
  recommendedTag?: 'Safest / Canonical' | 'Fastest Route' | 'Best Fee' | 'High Liquidity'
  riskProfile: DetailedRiskProfile
  baseGasUnits: number
  relayerFeeBps: number // basis points e.g. 5 = 0.05%
  destinationGasUnits: number
  demoNote: string
}
