import { describe, expect, it } from 'vitest'
import { keccak256, toUtf8Bytes } from 'ethers'
import { DEMO_ROUTES } from './mockData'
import {
  assertRouteAssessmentNetwork,
  createRouteAssessmentPayload,
  isValidRouteGuardAddress,
  MST_CORAL_CHAIN_ID,
} from './routeAssessment'

describe('route assessment payload', () => {
  it('converts the route security score into a contract risk score', () => {
    const payload = createRouteAssessmentPayload(DEMO_ROUTES[0])

    expect(payload.routeName).toBe(DEMO_ROUTES[0].name)
    expect(payload.riskScore).toBe(6)
    expect(payload.approved).toBe(true)
  })

  it('hashes the exact report data sent with the assessment', () => {
    const route = DEMO_ROUTES[0]
    const riskScore = 100 - route.riskProfile.score
    const report = JSON.stringify({
      routeName: route.name,
      riskScore,
      securityScore: route.riskProfile.score,
      riskLevel: route.riskProfile.level,
      summary: route.riskProfile.summary,
    })

    expect(createRouteAssessmentPayload(route).reportHash).toBe(keccak256(toUtf8Bytes(report)))
  })

  it('uses the configured MST Coral chain ID', () => {
    expect(MST_CORAL_CHAIN_ID).toBe(54635n)
  })

  it('accepts a valid contract address and rejects invalid input', () => {
    expect(isValidRouteGuardAddress('0x0000000000000000000000000000000000000001')).toBe(true)
    expect(isValidRouteGuardAddress('not-an-address')).toBe(false)
  })

  it('allows MST Coral and rejects other chains before submitting', () => {
    expect(() => assertRouteAssessmentNetwork(MST_CORAL_CHAIN_ID)).not.toThrow()
    expect(() => assertRouteAssessmentNetwork(11155111n)).toThrow(/No transaction was sent/)
  })
})
