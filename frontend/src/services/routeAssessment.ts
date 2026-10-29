import { BrowserProvider, Contract, isAddress, keccak256, toUtf8Bytes } from 'ethers'
import type { Route } from '../types/route'

export const MST_CORAL_CHAIN_ID = 54635n
export const routeGuardContractAddress = import.meta.env.VITE_ROUTEGUARD_CONTRACT_ADDRESS?.trim() ?? ''

const routeGuardAbi = [
  'function recordAssessment(string routeName, uint8 riskScore, bool approved, string reportHash) returns (uint256 id)',
  'event AssessmentRecorded(uint256 indexed id, string routeName, uint8 riskScore, bool approved, address indexed assessor)',
]

export interface RouteAssessmentPayload {
  routeName: string
  riskScore: number
  approved: boolean
  reportHash: string
}

export function isValidRouteGuardAddress(address: string): boolean {
  return isAddress(address)
}

export function assertRouteAssessmentNetwork(chainId: bigint): void {
  if (chainId !== MST_CORAL_CHAIN_ID) {
    throw new Error(`Switch your wallet to MST Coral (chain ID ${MST_CORAL_CHAIN_ID}). No transaction was sent.`)
  }
}

export function createRouteAssessmentPayload(route: Route): RouteAssessmentPayload {
  const riskScore = 100 - route.riskProfile.score
  const report = JSON.stringify({
    routeName: route.name,
    riskScore,
    securityScore: route.riskProfile.score,
    riskLevel: route.riskProfile.level,
    summary: route.riskProfile.summary,
  })

  return {
    routeName: route.name,
    riskScore,
    approved: riskScore < 60,
    reportHash: keccak256(toUtf8Bytes(report)),
  }
}

export function getConfiguredRouteGuardAddress(): string | null {
  return isValidRouteGuardAddress(routeGuardContractAddress) ? routeGuardContractAddress : null
}

export async function recordRouteAssessment(route: Route, contractAddress = routeGuardContractAddress) {
  if (!isValidRouteGuardAddress(contractAddress)) {
    throw new Error('Configure a valid RouteGuard contract address before recording an assessment.')
  }

  const ethereum = (window as Window & { ethereum?: ConstructorParameters<typeof BrowserProvider>[0] }).ethereum
  if (!ethereum) {
    throw new Error('No injected wallet was found. Install or enable a compatible wallet first.')
  }

  const provider = new BrowserProvider(ethereum)
  const network = await provider.getNetwork()
  assertRouteAssessmentNetwork(network.chainId)

  const signer = await provider.getSigner()
  const contract = new Contract(contractAddress, routeGuardAbi, signer)
  const payload = createRouteAssessmentPayload(route)
  const transaction = await contract.recordAssessment(
    payload.routeName,
    payload.riskScore,
    payload.approved,
    payload.reportHash,
  )
  const receipt = await transaction.wait()

  return {
    transactionHash: receipt.hash,
    payload,
  }
}
