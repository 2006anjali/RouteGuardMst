import { BrowserProvider, Contract, isAddress, keccak256, toUtf8Bytes } from 'ethers'
import type { Route } from '../types/route'
import { evaluateRouteRisk } from './riskEngine'
import { getMetaMaskProvider } from './walletProvider'

export const MST_CORAL_CHAIN_ID = 54635n
export const MST_CORAL_EXPLORER_URL = 'https://coral.mstscan.com'
export const routeGuardContractAddress = '0x980aD38BbD4059499290DA1a460f886d20755411'

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

export function tryAcquireAssessmentSubmission(lock: { current: boolean }): boolean {
  if (lock.current) return false
  lock.current = true
  return true
}

export function createRouteAssessmentPayload(route: Route): RouteAssessmentPayload {
  const securityScore = evaluateRouteRisk(route).score
  const riskScore = 100 - securityScore
  const report = JSON.stringify({
    routeName: route.name,
    riskScore,
    securityScore,
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

export async function recordRouteAssessment(
  payload: RouteAssessmentPayload,
  onSubmitted: (transactionHash: string) => void,
  contractAddress = routeGuardContractAddress,
) {
  if (!isValidRouteGuardAddress(contractAddress)) {
    throw new Error('Configure a valid RouteGuard contract address before recording an assessment.')
  }

  const ethereum = getMetaMaskProvider() as ConstructorParameters<typeof BrowserProvider>[0] | undefined
  if (!ethereum) {
    throw new Error('No injected wallet was found. Install or enable a compatible wallet first.')
  }

  const provider = new BrowserProvider(ethereum)
  try {
    const signer = await provider.getSigner()
    const chainId = BigInt(await provider.send('eth_chainId', []))
    assertRouteAssessmentNetwork(chainId)

    const contract = new Contract(contractAddress, routeGuardAbi, signer)
    const transaction = await contract.recordAssessment(
      payload.routeName,
      payload.riskScore,
      payload.approved,
      payload.reportHash,
    )
    onSubmitted(transaction.hash)
    const receipt = await transaction.wait()

    return { transactionHash: transaction.hash, receipt, payload }
  } finally {
    provider.destroy()
  }
}
