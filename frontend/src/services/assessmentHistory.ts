import { Contract, Interface, JsonRpcProvider } from 'ethers'
import type { OnChainAssessmentRecord } from '../types/assessment'
import {
  MST_CORAL_CHAIN_ID,
  MST_CORAL_RPC_URL,
  ROUTEGUARD_CONTRACT_ADDRESS,
  ROUTEGUARD_READ_ABI,
} from './onChainAssessment'

export interface AssessmentHistoryReader {
  readNextAssessmentId(): Promise<bigint>
  readAssessment(id: bigint): Promise<OnChainAssessmentRecord>
  readAssessmentEvents(): Promise<Array<{ id: string; transactionHash: string; blockNumber: number }>>
  close(): void
}

function createAssessmentHistoryReader(): AssessmentHistoryReader {
  const provider = new JsonRpcProvider(MST_CORAL_RPC_URL, Number(MST_CORAL_CHAIN_ID))
  const contract = new Contract(ROUTEGUARD_CONTRACT_ADDRESS, ROUTEGUARD_READ_ABI, provider)
  const contractInterface = new Interface(ROUTEGUARD_READ_ABI)
  const assessmentRecordedEvent = contractInterface.getEvent('AssessmentRecorded')
  if (!assessmentRecordedEvent) {
    provider.destroy()
    throw new Error('RouteGuard AssessmentRecorded event is missing from the read ABI.')
  }
  const eventTopic = assessmentRecordedEvent.topicHash

  return {
    async readNextAssessmentId() {
      const network = await provider.getNetwork()
      if (network.chainId !== MST_CORAL_CHAIN_ID) {
        throw new Error(`Coral RPC returned unexpected chain ID ${network.chainId}.`)
      }
      return BigInt(await contract.nextAssessmentId())
    },
    async readAssessment(id) {
      const record = await contract.assessments(id)
      return {
        id: record.id.toString(),
        routeName: record.routeName,
        riskScore: Number(record.riskScore),
        approved: record.approved,
        reportHash: record.reportHash,
        assessor: record.assessor,
        timestamp: record.timestamp.toString(),
        transactionHash: null,
      }
    },
    async readAssessmentEvents() {
      const logs = await provider.getLogs({
        address: ROUTEGUARD_CONTRACT_ADDRESS,
        topics: [eventTopic],
        fromBlock: 0,
        toBlock: 'latest',
      })
      return logs.flatMap((log) => {
        try {
          const parsed = contractInterface.parseLog(log)
          return parsed?.name === 'AssessmentRecorded'
            ? [{ id: parsed.args.id.toString(), transactionHash: log.transactionHash, blockNumber: log.blockNumber }]
            : []
        } catch {
          return []
        }
      })
    },
    close() {
      provider.destroy()
    },
  }
}

export async function fetchAssessmentHistory(
  createReader: () => AssessmentHistoryReader = createAssessmentHistoryReader,
): Promise<OnChainAssessmentRecord[]> {
  const reader = createReader()

  try {
    const nextAssessmentId = await reader.readNextAssessmentId()
    const eventByAssessmentId = new Map<string, { transactionHash: string; blockNumber: number }>()

    try {
      const events = await reader.readAssessmentEvents()
      for (const event of events) {
        eventByAssessmentId.set(event.id, {
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        })
      }
    } catch {
      // Mapping data remains useful when the RPC cannot return historical logs.
    }

    const records: OnChainAssessmentRecord[] = []
    for (let id = 1n; id < nextAssessmentId; id += 1n) {
      const record = await reader.readAssessment(id)
      if (record.id !== id.toString() || !record.routeName.trim()) continue
      const event = eventByAssessmentId.get(record.id)
      records.push({
        ...record,
        transactionHash: event?.transactionHash ?? null,
        blockNumber: event?.blockNumber ?? null,
      })
    }

    return records.reverse()
  } finally {
    reader.close()
  }
}

export function getLatestAssessmentRecord(
  records: readonly OnChainAssessmentRecord[],
): OnChainAssessmentRecord | null {
  return records[0] ?? null
}