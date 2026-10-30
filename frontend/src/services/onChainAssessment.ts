import { Contract, JsonRpcProvider } from 'ethers'

export const MST_CORAL_CHAIN_ID = 54635n
export const MST_CORAL_RPC_URL = 'https://coralrpc.mstblockchain.com/'
export const ROUTEGUARD_CONTRACT_ADDRESS = '0x980aD38BbD4059499290DA1a460f886d20755411'
export const ON_CHAIN_ASSESSMENT_ID = 1n

export const ROUTEGUARD_READ_ABI = [
  'function assessments(uint256) view returns (uint256 id, string routeName, uint8 riskScore, bool approved, string reportHash, address assessor, uint256 timestamp)',
  'function nextAssessmentId() view returns (uint256)',
  'event AssessmentRecorded(uint256 indexed id, string routeName, uint8 riskScore, bool approved, address indexed assessor)',
]

export interface OnChainAssessment {
  id: string
  routeName: string
  riskScore: number
  approved: boolean
  reportHash: string
  assessor: string
  timestamp: string
}

export interface OnChainAssessmentData {
  assessment: OnChainAssessment
  nextAssessmentId: string
}

export async function fetchOnChainAssessment(): Promise<OnChainAssessmentData> {
  const provider = new JsonRpcProvider(MST_CORAL_RPC_URL, Number(MST_CORAL_CHAIN_ID))
  const contract = new Contract(ROUTEGUARD_CONTRACT_ADDRESS, ROUTEGUARD_READ_ABI, provider)

  try {
    const [record, nextAssessmentId] = await Promise.all([
      contract.assessments(ON_CHAIN_ASSESSMENT_ID),
      contract.nextAssessmentId(),
    ])

    return {
      assessment: {
        id: record.id.toString(),
        routeName: record.routeName,
        riskScore: Number(record.riskScore),
        approved: record.approved,
        reportHash: record.reportHash,
        assessor: record.assessor,
        timestamp: record.timestamp.toString(),
      },
      nextAssessmentId: nextAssessmentId.toString(),
    }
  } finally {
    provider.destroy()
  }
}