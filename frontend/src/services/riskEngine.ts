import type { Route, RiskLevel } from '../types/route'

export interface RiskAnalysisResult {
  score: number // 0-100
  level: RiskLevel
  primaryWarning?: string
  highlights: string[]
  strengths: string[]
  vulnerabilities: string[]
}

/**
 * Computes an explainable risk evaluation for a given cross-chain route.
 */
export function evaluateRouteRisk(route: Route): RiskAnalysisResult {
  const profile = route.riskProfile
  const score = profile.score

  const strengths: string[] = []
  const vulnerabilities: string[] = []

  profile.vectors.forEach((v) => {
    if (v.rating === 'Strong') {
      strengths.push(`${v.title}: ${v.details}`)
    } else {
      vulnerabilities.push(`${v.title}: ${v.details}`)
    }
  })

  let primaryWarning: string | undefined
  if (profile.level === 'High') {
    primaryWarning = 'High Risk Warning: Custodial or weakly decentralized bridge architecture. High vulnerability to private key compromise or un-timelocked upgrades.'
  } else if (profile.level === 'Medium') {
    primaryWarning = 'Medium Risk: Relies on external verifier networks or dynamic liquidity pools. Verify validator configuration before large transfers.'
  }

  const highlights = [
    `Trust Model: ${profile.trustModel}`,
    `Validator Security: ${profile.validatorSet}`,
    `Upgrade Delay: ${profile.timelockDelay}`,
    `Smart Contract Audits: ${profile.audits.map((a) => `${a.firm} (${a.date})`).join(', ')}`,
  ]

  return {
    score,
    level: profile.level,
    primaryWarning,
    highlights,
    strengths,
    vulnerabilities,
  }
}

/**
 * Validates an EVM 42-character hexadecimal address.
 */
export function validateEvmAddress(address: string): { isValid: boolean; message: string } {
  const trimmed = address.trim()
  if (!trimmed) {
    return { isValid: true, message: 'Optional address omitted.' }
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return {
      isValid: false,
      message: 'Invalid EVM address format. Must be a 42-character hex string starting with 0x.',
    }
  }

  // Check for burn/null address
  if (/^0x0{40}$/.test(trimmed)) {
    return {
      isValid: false,
      message: 'Warning: 0x000...000 is the null address. Tokens sent here will be permanently destroyed.',
    }
  }

  return {
    isValid: true,
    message: 'Valid EVM address format (demo syntax verification only; not verified against contract bytecode).',
  }
}

