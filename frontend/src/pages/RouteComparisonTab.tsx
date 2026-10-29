import { useState } from 'react'
import type { Route } from '../types/route'
import { calculateRouteFees } from '../services/feeCalculator'
import { evaluateRouteRisk } from '../services/riskEngine'
import { DemoBadge } from '../components/DemoBanner'
import {
  ShieldIcon,
  ZapIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  FilterIcon,
  InfoIcon,
} from '../components/Icons'

interface RouteComparisonTabProps {
  routes: Route[]
  selectedRouteId: number
  onSelectRoute: (id: number) => void
  amount: string
  onChangeAmount: (val: string) => void
  destinationAddress: string
  onStartSimulation: (route: Route, amount: string, destAddress: string) => void
}

type FilterOption = 'all' | 'safest' | 'fastest' | 'best_fee' | 'low_risk' | 'high_risk'

export function RouteComparisonTab({
  routes,
  selectedRouteId,
  onSelectRoute,
  amount,
  onChangeAmount,
  destinationAddress,
  onStartSimulation,
}: RouteComparisonTabProps) {
  const [filter, setFilter] = useState<FilterOption>('all')
  const [expandedRouteId, setExpandedRouteId] = useState<number | null>(selectedRouteId)
  const [recordingRouteId, setRecordingRouteId] = useState<number | null>(null)
  const [recordResult, setRecordResult] = useState<{ routeId: number; transactionHash: string } | null>(null)
  const [recordError, setRecordError] = useState<{ routeId: number; message: string } | null>(null)
  const routeGuardAddress = import.meta.env.VITE_ROUTEGUARD_CONTRACT_ADDRESS?.trim() ?? ''
  const hasConfiguredContract = /^0x[a-fA-F0-9]{40}$/.test(routeGuardAddress)

  const handleRecordAssessment = async (route: Route) => {
    setRecordingRouteId(route.id)
    setRecordResult(null)
    setRecordError(null)

    try {
      const { recordRouteAssessment } = await import('../services/routeAssessment')
      const result = await recordRouteAssessment(route, routeGuardAddress)
      setRecordResult({ routeId: route.id, transactionHash: result.transactionHash })
    } catch (error) {
      setRecordError({
        routeId: route.id,
        message: error instanceof Error ? error.message : 'Assessment could not be recorded.',
      })
    } finally {
      setRecordingRouteId(null)
    }
  }

  // Filter routes according to selected criterion
  const filteredRoutes = routes.filter((r) => {
    if (filter === 'safest') return r.recommendedTag === 'Safest / Canonical' || r.riskProfile.score >= 90
    if (filter === 'fastest') return r.timeMinutes <= 2 || r.recommendedTag === 'Fastest Route'
    if (filter === 'best_fee') return r.relayerFeeBps <= 3 || r.recommendedTag === 'Best Fee'
    if (filter === 'low_risk') return r.riskProfile.level === 'Low'
    if (filter === 'high_risk') return r.riskProfile.level === 'High'
    return true
  })

  const toggleExpand = (id: number) => {
    setExpandedRouteId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="tab-container">
      {/* Header and Controls */}
      <section className="comparison-header-panel panel">
        <div className="comparison-title-row">
          <div>
            <p className="eyebrow">CROSS-CHAIN PROTOCOL MATRIX</p>
            <h2>Route Comparison &amp; Architecture Audit</h2>
            <p className="subtitle">
              Inspect bridge security architecture, validator decentralization, formal audit reports, and dynamic fee estimates side-by-side.
            </p>
          </div>
          <div className="comparison-controls">
            <div className="amount-input-compact">
              <label htmlFor="comp-amount">Amount ({routes[0].fromToken}):</label>
              <input
                id="comp-amount"
                type="number"
                min="0.001"
                step="any"
                value={amount}
                onChange={(e) => onChangeAmount(e.target.value)}
                placeholder="0.1"
              />
            </div>
            <DemoBadge label="SIMULATED BENCHMARKS" variant="accent" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="filter-bar">
          <div className="filter-label">
            <FilterIcon style={{ width: 14, height: 14 }} />
            <span>Filter Criteria:</span>
          </div>
          <div className="filter-pills">
            <button
              type="button"
              className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Routes ({routes.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'safest' ? 'active' : ''}`}
              onClick={() => setFilter('safest')}
            >
              🛡️ Safest / Canonical
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'fastest' ? 'active' : ''}`}
              onClick={() => setFilter('fastest')}
            >
              ⚡ Fastest (~1–2m)
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'best_fee' ? 'active' : ''}`}
              onClick={() => setFilter('best_fee')}
            >
              💎 Lowest Fee
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'low_risk' ? 'active' : ''}`}
              onClick={() => setFilter('low_risk')}
            >
              ✓ Low Risk Only
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'high_risk' ? 'active' : ''}`}
              onClick={() => setFilter('high_risk')}
            >
              ⚠️ High Risk Demo
            </button>
          </div>
        </div>
      </section>

      {/* Comparison Cards / Matrix */}
      <div className="comparison-grid">
        {filteredRoutes.map((route) => {
          const fees = calculateRouteFees(route, amount)
          const risk = evaluateRouteRisk(route)
          const isSelected = selectedRouteId === route.id
          const isExpanded = expandedRouteId === route.id
          const isHighRisk = route.riskProfile.level === 'High'

          return (
            <article
              key={route.id}
              className={`comparison-card panel ${isSelected ? 'highlight-border' : ''} ${
                isHighRisk ? 'high-risk-card' : ''
              }`}
            >
              {/* Card Header */}
              <div className="card-top-bar">
                <div className="card-title-group">
                  <div className="card-badges">
                    <span className={`risk-tag-badge risk-${route.riskProfile.level.toLowerCase()}`}>
                      {route.riskProfile.level} Risk · {route.riskProfile.score}/100
                    </span>
                    {route.recommendedTag && (
                      <span className={`recommended-chip chip-${route.recommendedTag.toLowerCase().includes('safest') ? 'safe' : route.recommendedTag.toLowerCase().includes('fastest') ? 'fast' : 'fee'}`}>
                        {route.recommendedTag}
                      </span>
                    )}
                    {isHighRisk && (
                      <span className="risk-warning-badge">⚠️ Educational High-Risk Flag</span>
                    )}
                    <DemoBadge label="SIMULATED" variant="subtle" />
                  </div>
                  <h3>{route.name}</h3>
                  <p className="card-tagline">{route.tagline}</p>
                </div>

                <div className="card-score-gauge">
                  <span className="score-num">{route.riskProfile.score}</span>
                  <span className="score-denom">/100</span>
                  <div className="mini-gauge-bar">
                    <div
                      className={`mini-gauge-fill fill-${route.riskProfile.level.toLowerCase()}`}
                      style={{ width: `${route.riskProfile.score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Path & Protocol */}
              <div className="card-route-summary">
                <div className="route-path-display">
                  <span className="chain-badge source">{route.fromChain}</span>
                  <span className="route-arrow">➔</span>
                  <span className="chain-badge dest">{route.toChain}</span>
                </div>
                <div className="architecture-tag">
                  <ShieldIcon style={{ width: 13, height: 13 }} />
                  <span>{route.riskProfile.architectureType}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="card-metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">Estimated Latency</span>
                  <strong className="metric-value">
                    <ClockIcon style={{ width: 13, height: 13 }} /> {route.baseEstimatedTime}
                  </strong>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Estimated Total Fee</span>
                  <strong className="metric-value highlight-fee">
                    ${fees.totalFeeUsd} <small>({fees.totalFeeEth} ETH)</small>
                  </strong>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Relayer / Protocol Fee</span>
                  <strong className="metric-value">
                    {route.relayerFeeBps === 0 ? '0% (Canonical)' : `${route.relayerFeeBps / 100}% ($${fees.relayerFeeUsd})`}
                  </strong>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Timelock Window</span>
                  <strong className="metric-value">
                    {route.riskProfile.timelockDelay}
                  </strong>
                </div>
              </div>

              {/* Fee Breakdown Mini Drawer */}
              <div className="mini-fee-breakdown">
                <span className="mini-fee-title">Fee Breakdown:</span>
                <span className="mini-fee-item">Source Gas: ${fees.sourceGasFeeUsd}</span>
                <span className="mini-fee-item">Destination Gas: ${fees.destinationGasFeeUsd}</span>
                <span className="mini-fee-item">Slippage Buffer: ${fees.slippageBufferUsd}</span>
              </div>

              {/* Deep Risk Vectors (Expanded or Collapsed) */}
              {isExpanded ? (
                <div className="expanded-risk-details">
                  <div className="details-divider" />
                  <div className="expanded-section-title">
                    <ShieldIcon style={{ width: 15, height: 15 }} />
                    <h4>Explainable Risk Evaluation &amp; Trust Model</h4>
                  </div>

                  <p className="risk-summary-text">{route.riskProfile.summary}</p>

                  <div className="vector-breakdown-list">
                    {route.riskProfile.vectors.map((vec, idx) => (
                      <div key={idx} className="vector-item">
                        <div className="vector-header">
                          <span className="vector-title">{vec.title}</span>
                          <span className={`vector-rating rating-${vec.rating.toLowerCase()}`}>
                            {vec.rating} ({vec.score}/100)
                          </span>
                        </div>
                        <p className="vector-details">{vec.details}</p>
                      </div>
                    ))}
                  </div>

                  {/* Audit Reports */}
                  <div className="audit-credentials">
                    <span className="audit-label">Security Audits on Record:</span>
                    <div className="audit-pills">
                      {route.riskProfile.audits.map((audit, i) => (
                        <span key={i} className="audit-pill">
                          <CheckCircleIcon style={{ width: 12, height: 12 }} />
                          {audit.firm} ({audit.date})
                        </span>
                      ))}
                    </div>
                  </div>

                  {risk.primaryWarning && (
                    <div className="route-danger-notice">
                      <AlertTriangleIcon style={{ width: 16, height: 16 }} />
                      <div>
                        <strong>Security Advisory</strong>
                        <p>{risk.primaryWarning}</p>
                      </div>
                    </div>
                  )}

                  <div className="demo-footnote">
                    <InfoIcon style={{ width: 12, height: 12 }} />
                    <span>{route.demoNote}</span>
                  </div>
                </div>
              ) : null}

              {/* Card Footer Actions */}
              <div className="card-action-bar">
                <button
                  type="button"
                  className="card-text-button"
                  onClick={() => toggleExpand(route.id)}
                >
                  {isExpanded ? 'Hide Security Details ▲' : 'Inspect Risk Architecture ▼'}
                </button>

                <div className="card-primary-actions">
                  <button
                    type="button"
                    className={`btn-select ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectRoute(route.id)}
                  >
                    {isSelected ? '✓ Selected Route' : 'Select'}
                  </button>
                  <button
                    type="button"
                    className="btn-simulate"
                    onClick={() => onStartSimulation(route, amount, destinationAddress)}
                  >
                    <span>Simulate Transfer</span>
                    <ZapIcon style={{ width: 13, height: 13 }} />
                  </button>
                  {hasConfiguredContract && (
                    <button
                      type="button"
                      className="btn-select"
                      disabled={recordingRouteId !== null}
                      onClick={() => handleRecordAssessment(route)}
                    >
                      {recordingRouteId === route.id ? 'Confirm in wallet...' : 'Record assessment on-chain'}
                    </button>
                  )}
                </div>
              </div>

              {recordResult?.routeId === route.id && (
                <p className="field-help" role="status">Recorded. Transaction: {recordResult.transactionHash}</p>
              )}
              {recordError?.routeId === route.id && (
                <p className="field-help" role="alert">{recordError.message}</p>
              )}
            </article>
          )
        })}
      </div>

      {filteredRoutes.length === 0 && (
        <div className="no-routes-panel panel">
          <p>No routes match the selected filter. Try switching back to "All Routes".</p>
          <button type="button" className="btn-select" onClick={() => setFilter('all')}>
            Reset Filters
          </button>
        </div>
      )}

      {/* Trade-off Guidance Summary */}
      <section className="tradeoff-guide panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">SECURITY TRADEOFF ANALYSIS</p>
            <h2>Cross-Chain Architecture Archetypes</h2>
          </div>
          <DemoBadge label="GUIDELINE" variant="subtle" />
        </div>
        <div className="tradeoff-columns">
          <div className="tradeoff-col">
            <span className="col-icon">🛡️</span>
            <strong>Canonical Rollup Bridges</strong>
            <p>
              Anchored directly to Ethereum L1 state verification without external validator multi-sigs. Maximum cryptographic security with native fraud/validity proofs.
            </p>
          </div>
          <div className="tradeoff-col">
            <span className="col-icon">⚡</span>
            <strong>Intent-Based Networks (Across)</strong>
            <p>
              Optimized for speed and capital efficiency. Market-maker relayers front funds immediately, relying on optimistic challenge oracles (e.g. UMA) for batch root settlement.
            </p>
          </div>
          <div className="tradeoff-col">
            <span className="col-icon">💎</span>
            <strong>DVN Messaging (LayerZero / Stargate)</strong>
            <p>
              Broad multi-chain cross-chain messaging validated by configurable Decentralized Verifier Networks. Trust is proportional to the chosen DVN quorum.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
