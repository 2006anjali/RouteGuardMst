import { describe, expect, it } from 'vitest'
import { keccak256, toUtf8Bytes } from 'ethers'
import { DEMO_ROUTES } from './mockData'
import { evaluateRouteRisk } from './riskEngine'
import {
  assertRouteAssessmentNetwork,
  createRouteAssessmentPayload,
  isValidRouteGuardAddress,
  MST_CORAL_CHAIN_ID,
  tryAcquireAssessmentSubmission,
} from './routeAssessment'

describe('route assessment payload', () => {
  it('converts the route security score into a contract risk score', () => {
    const route = DEMO_ROUTES[0]
    const securityScore = evaluateRouteRisk(route).score
    const payload = createRouteAssessmentPayload(route)

    expect(payload.routeName).toBe(route.name)
    expect(payload.riskScore).toBe(100 - securityScore)
    expect(payload.approved).toBe(true)
  })

  it('approves only when calculated risk is below the existing threshold', () => {
    const route = DEMO_ROUTES[0]
    const saferRoute = {
      ...route,
      riskProfile: { ...route.riskProfile, score: 100 },
    }
    const riskierRoute = {
      ...route,
      riskProfile: { ...route.riskProfile, score: 40 },
    }

    expect(createRouteAssessmentPayload(saferRoute)).toMatchObject({ riskScore: 0, approved: true })
    expect(createRouteAssessmentPayload(riskierRoute)).toMatchObject({ riskScore: 60, approved: false })
  })

  it('hashes the exact report data sent with the assessment', () => {
    const route = DEMO_ROUTES[0]
    const securityScore = evaluateRouteRisk(route).score
    const riskScore = 100 - securityScore
    const report = JSON.stringify({
      routeName: route.name,
      riskScore,
      securityScore,
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

  it('blocks duplicate assessment submission attempts while one is in flight', () => {
    const lock = { current: false }

    expect(tryAcquireAssessmentSubmission(lock)).toBe(true)
    expect(tryAcquireAssessmentSubmission(lock)).toBe(false)
    lock.current = false
    expect(tryAcquireAssessmentSubmission(lock)).toBe(true)
  })
})
