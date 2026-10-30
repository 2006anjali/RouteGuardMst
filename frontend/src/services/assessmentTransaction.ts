import { Interface, JsonRpcProvider, isHexString } from 'ethers'
import {
  MST_CORAL_CHAIN_ID,
  MST_CORAL_RPC_URL,
  ROUTEGUARD_CONTRACT_ADDRESS,
} from './onChainAssessment'

export const CONFIRMED_ASSESSMENT_TRANSACTION_HASH =
  '0x353ca0b52409d1bc4a9de5de542c236c2e865969551b937afcdb0cc25645eb84'

const assessmentInterface = new Interface([
  'function recordAssessment(string routeName, uint8 riskScore, bool approved, string reportHash)',
  'event AssessmentRecorded(uint256 indexed id, string routeName, uint8 riskScore, bool approved, address indexed assessor)',
])

export type OnChainTransactionStatus = 'pending' | 'success' | 'failed'

export interface AssessmentTransactionRecord {
  transactionHash: string
  contractAddress: string
  chainId: string
  status: OnChainTransactionStatus
  blockNumber: number | null
  assessmentId: string | null
  routeName: string | null
  riskScore: number | null
  approved: boolean | null
}

export function getAssessmentTransactionStatus(receiptStatus: number | null): OnChainTransactionStatus {
  if (receiptStatus === null) return 'pending'
  if (receiptStatus === 1) return 'success'
  if (receiptStatus === 0) return 'failed'
  throw new Error(`Unexpected transaction receipt status: ${receiptStatus}`)
}

export async function fetchAssessmentTransaction(
  transactionHash = CONFIRMED_ASSESSMENT_TRANSACTION_HASH,
): Promise<AssessmentTransactionRecord | null> {
  if (!isHexString(transactionHash, 32)) {
    throw new Error('Assessment transaction hash is not a valid 32-byte hex value.')
  }

  const provider = new JsonRpcProvider(MST_CORAL_RPC_URL, Number(MST_CORAL_CHAIN_ID))

  try {
    const network = await provider.getNetwork()
    if (network.chainId !== MST_CORAL_CHAIN_ID) {
      throw new Error(`Coral RPC returned unexpected chain ID ${network.chainId}.`)
    }

    const transaction = await provider.getTransaction(transactionHash)
    if (!transaction) return null
    if (transaction.to?.toLowerCase() !== ROUTEGUARD_CONTRACT_ADDRESS.toLowerCase()) {
      throw new Error('The transaction destination does not match the deployed RouteGuard contract.')
    }

    const parsedCall = assessmentInterface.parseTransaction({ data: transaction.data })
    if (parsedCall?.name !== 'recordAssessment') {
      throw new Error('The transaction is not a RouteGuard recordAssessment call.')
    }

    const receipt = await provider.getTransactionReceipt(transactionHash)
    let eventData: Pick<AssessmentTransactionRecord, 'assessmentId' | 'routeName' | 'riskScore' | 'approved'> = {
      assessmentId: null,
      routeName: null,
      riskScore: null,
      approved: null,
    }

    if (receipt) {
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== ROUTEGUARD_CONTRACT_ADDRESS.toLowerCase()) continue
        try {
          const parsedLog = assessmentInterface.parseLog(log)
          if (parsedLog?.name === 'AssessmentRecorded') {
            eventData = {
              assessmentId: parsedLog.args.id.toString(),
              routeName: parsedLog.args.routeName,
              riskScore: Number(parsedLog.args.riskScore),
              approved: parsedLog.args.approved,
            }
            break
          }
        } catch {
          continue
        }
      }
    }

    return {
      transactionHash: transaction.hash,
      contractAddress: ROUTEGUARD_CONTRACT_ADDRESS,
      chainId: network.chainId.toString(),
      status: getAssessmentTransactionStatus(receipt?.status ?? null),
      blockNumber: receipt?.blockNumber ?? null,
      ...eventData,
    }
  } finally {
    provider.destroy()
  }
}