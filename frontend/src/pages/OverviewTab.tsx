import { useState } from 'react'
import type { Route } from '../types/route'
import type { TrackedTransaction } from '../types/transaction'
import { calculateRouteFees } from '../services/feeCalculator'
import { evaluateRouteRisk, validateEvmAddress } from '../services/riskEngine'
import { DemoBadge } from '../components/DemoBanner'
import { OnChainAssessmentPanel } from '../components/OnChainAssessmentPanel'
import {
  ShieldIcon,
  ZapIcon,
  ClockIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  LayersIcon,
  CheckCircleIcon,
} from '../components/Icons'

interface OverviewTabProps {
  routes: Route[]
  selectedRouteId: number
  onSelectRoute: (id: number) => void
  amount: string
  onChangeAmount: (val: string) => void
  destinationAddress: string
  onChangeDestinationAddress: (val: string) => void
  walletAccount: string | null
  walletNetwork: string | null
  isDemoWallet: boolean
  transactions: TrackedTransaction[]
  onNavigateTab: (tab: string) => void
  onStartSimulation: (route: Route, amount: string, destAddress: string) => void
}

export function OverviewTab({
  routes,
  selectedRouteId,
  onSelectRoute,
  amount,
  onChangeAmount,
  destinationAddress,
  onChangeDestinationAddress,
  walletAccount,
  walletNetwork,
  isDemoWallet,
  transactions,
  onNavigateTab,
  onStartSimulation,
}: OverviewTabProps) {
  const [addressFeedback, setAddressFeedback] = useState<string | null>(null)

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? routes[0]
  const fees = calculateRouteFees(selectedRoute, amount)
  const riskAnalysis = evaluateRouteRisk(selectedRoute)

  const activeTxCount = transactions.filter((t) => t.status === 'in_progress').length
  const totalCompletedTxCount = transactions.filter((t) => t.status === 'completed').length

  const handleAddressChange = (val: string) => {
    onChangeDestinationAddress(val)
    if (val.trim()) {
      const res = validateEvmAddress(val)
      setAddressFeedback(res.message)
    } else {
      setAddressFeedback(null)
    }
  }

  // Quick preset amount buttons
  const presetAmounts = ['0.05', '0.1', '0.5', '1.0']

  return (
    <div className="tab-container">
      <OnChainAssessmentPanel />

      {/* Executive Key Metric Cards */}
      <section className="stats-grid" aria-label="Key Security Metrics">
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-label">MONITORED BRIDGES</span>
            <div className="stat-icon-badge">
              <LayersIcon style={{ width: 16, height: 16 }} />
            </div>
          </div>
          <div className="stat-value-row">
            <div className="stat-value">{routes.length.toString().padStart(2, '0')}</div>
            <span className="stat-badge-sub">Active Paths</span>
          </div>
          <div className="stat-foot">
            <span className="chain-dots">
              <span className="dot dot-eth" title="Ethereum Sepolia" />
              <span className="dot dot-arb" title="Arbitrum Sepolia" />
              <span className="dot dot-base" title="Base Sepolia" />
              <span className="dot dot-poly" title="Polygon Amoy" />
            </span>
            <span>Sepolia L1 &amp; L2 Rollups</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-label">SECURITY RATING</span>
            <div className="stat-icon-badge">
              <ShieldIcon style={{ width: 16, height: 16 }} />
            </div>
          </div>
          <div className="stat-value-row">
            <div className="stat-value">
              {selectedRoute.riskProfile.score}
              <span className="stat-unit">/100</span>
            </div>
            <span className={`stat-badge-risk risk-${selectedRoute.riskProfile.level.toLowerCase()}`}>
              {selectedRoute.riskProfile.score >= 90 ? 'Tier A+' : selectedRoute.riskProfile.score >= 80 ? 'Tier B' : 'Tier D'}
            </span>
          </div>
          <div className="stat-foot">
            <div className="mini-progress-bar">
              <div
                className={`mini-progress-fill fill-${selectedRoute.riskProfile.level.toLowerCase()}`}
                style={{ width: `${selectedRoute.riskProfile.score}%` }}
              />
            </div>
            <span>{selectedRoute.riskProfile.level} Risk Profile</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-label">LIFECYCLE TRACKER</span>
            <div className="stat-icon-badge">
              <ZapIcon style={{ width: 16, height: 16 }} />
            </div>
          </div>
          <div className="stat-value-row">
            <div className="stat-value">
              {activeTxCount > 0 ? (
                <span className="active-glow">{activeTxCount} In-Flight</span>
              ) : (
                `${totalCompletedTxCount} Done`
              )}
            </div>
            <span className="stat-badge-sub">{transactions.length} Total</span>
          </div>
          <div className="stat-foot">
            <span className="pulse-dot-green" />
            <span>Simulated cross-chain lifecycle</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-label">ACCOUNT / WALLET</span>
            <div className="stat-icon-badge">
              <ClockIcon style={{ width: 16, height: 16 }} />
            </div>
          </div>
          <div className="stat-value-row">
            <div className="stat-value small-value">
              {walletAccount ? `${walletAccount.slice(0, 6)}...${walletAccount.slice(-4)}` : 'Disconnected'}
            </div>
            {walletAccount && <span className="stat-badge-connected">{isDemoWallet ? 'Demo' : 'Active'}</span>}
          </div>
          <div className="stat-foot wallet-stat-foot">
            <span className="mono-foot">
              {walletAccount
                ? isDemoWallet
                  ? 'Demo wallet; no network connected'
                  : `Wallet network: ${walletNetwork ?? 'Checking network...'}`
                : 'No wallet connected'}
            </span>
            <span className="mono-foot">Simulation context: Ethereum Sepolia</span>
          </div>
        </article>
      </section>

      {/* Visual Cross-Chain Security Score Benchmark (Horizontal Bar Matrix) */}
      <section className="panel security-matrix-banner" aria-label="Comparative Route Security Benchmark">
        <div className="matrix-banner-header">
          <div>
            <p className="eyebrow">SECURITY BENCHMARK MATRIX</p>
            <h3>Comparative Bridge Trust Index</h3>
          </div>
          <div className="matrix-legend">
            <span className="legend-item"><span className="legend-dot green" /> Canonical / Rollup (90+)</span>
            <span className="legend-item"><span className="legend-dot cyan" /> Intent Relayers (85-89)</span>
            <span className="legend-item"><span className="legend-dot amber" /> DVN Messaging (80-84)</span>
            <span className="legend-item"><span className="legend-dot rose" /> Centralized Custody (&lt;70)</span>
            <DemoBadge label="SIMULATED BENCHMARK" variant="subtle" />
          </div>
        </div>

        <div className="matrix-bars-grid">
          {routes.map((r) => {
            const isSelected = selectedRouteId === r.id
            const scoreClass = r.riskProfile.score >= 90 ? 'score-high' : r.riskProfile.score >= 80 ? 'score-mid' : 'score-low'
            return (
              <button
                key={r.id}
                type="button"
                className={`matrix-bar-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectRoute(r.id)}
                title={`Click to inspect ${r.name}`}
              >
                <div className="matrix-bar-meta">
                  <div className="matrix-route-info">
                    <span className="matrix-radio-indicator">{isSelected ? '●' : '○'}</span>
                    <strong>{r.name}</strong>
                    <span className="matrix-arch-tag">{r.riskProfile.architectureType}</span>
                  </div>
                  <div className="matrix-score-info">
                    <span className="matrix-time">{r.baseEstimatedTime}</span>
                    <strong className={`matrix-score-num ${scoreClass}`}>{r.riskProfile.score}/100</strong>
                  </div>
                </div>
                <div className="matrix-track">
                  <div
                    className={`matrix-fill ${scoreClass}`}
                    style={{ width: `${r.riskProfile.score}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="content-grid">
        {/* Left: Quick Route Evaluator */}
        <article className="panel analysis-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ROUTE INTELLIGENCE &amp; EVALUATION</p>
              <h2>Quick Cross-Chain Scan</h2>
            </div>
            <DemoBadge label="DYNAMIC ESTIMATOR" variant="emerald" />
          </div>

          <div className="form-group">
            <div className="label-with-presets">
              <label htmlFor="overview-amount">Transfer Amount ({selectedRoute.fromToken})</label>
              <div className="amount-presets">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`preset-btn ${amount === preset ? 'active' : ''}`}
                    onClick={() => onChangeAmount(preset)}
                  >
                    {preset} ETH
                  </button>
                ))}
              </div>
            </div>
            <div className="input-with-adornment">
              <input
                id="overview-amount"
                type="number"
                min="0.001"
                step="any"
                value={amount}
                onChange={(e) => onChangeAmount(e.target.value)}
                placeholder="0.1"
              />
              <span className="input-adornment">{selectedRoute.fromToken}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="overview-dest-address">Destination Contract / Recipient Address (Optional)</label>
            <input
              id="overview-dest-address"
              type="text"
              value={destinationAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="0x..."
              spellCheck={false}
              autoComplete="off"
            />
            {addressFeedback ? (
              <p className={`field-help ${addressFeedback.includes('Invalid') || addressFeedback.includes('Warning') ? 'field-error' : 'field-valid'}`}>
                {addressFeedback}
              </p>
            ) : (
              <p className="field-help">Formats checked locally via RFC-55. Bytecode verification is simulated in testnet mode.</p>
            )}
          </div>

          <div className="route-selection-header">
            <label className="section-label">Select Cross-Chain Route to Inspect</label>
            <span className="route-count-tag">{routes.length} Available</span>
          </div>

          <div className="route-options">
            {routes.map((r) => {
              const isSelected = selectedRouteId === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`route-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectRoute(r.id)}
                >
                  <span className="route-radio">{isSelected ? '●' : '○'}</span>
                  <div className="route-option-text">
                    <div className="route-header-row">
                      <strong>{r.name}</strong>
                      {r.recommendedTag && (
                        <span className="recommended-chip">{r.recommendedTag}</span>
                      )}
                    </div>
                    <small>{r.fromChain} → {r.toChain} · Est. {r.baseEstimatedTime}</small>
                  </div>
                  <span className={`risk-tag risk-${r.riskProfile.level.toLowerCase()}`}>
                    {r.riskProfile.score}/100 · {r.riskProfile.level}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="actions-cluster">
            <button
              type="button"
              className="analyze-button"
              onClick={() => onNavigateTab('Route Analysis')}
            >
              <span>Compare All {routes.length} Routes in Matrix</span>
              <ArrowRightIcon style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </article>

        {/* Right: Selected Route Intelligence & Dynamic Fees */}
        <div className="right-column">
          <article className="panel route-summary">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">SELECTED ROUTE SECURITY AUDIT</p>
                <h2>{selectedRoute.name}</h2>
              </div>
              <span className={`risk-tag-lg risk-${selectedRoute.riskProfile.level.toLowerCase()}`}>
                Score: {selectedRoute.riskProfile.score}/100
              </span>
            </div>

            {/* Chain Flow Node Diagram */}
            <div className="chain-flow">
              <div className="chain-node">
                <div className="chain-logo eth">Ξ</div>
                <div>
                  <strong>{selectedRoute.fromChain}</strong>
                  <small>Source Network (L1)</small>
                </div>
              </div>
              <div className="flow-line">
                <span className="flow-bridge-badge">{selectedRoute.riskProfile.architectureType}</span>
                <span className="flow-arrow">➔</span>
              </div>
              <div className="chain-node">
                <div className="chain-logo dest">⬡</div>
                <div>
                  <strong>{selectedRoute.toChain}</strong>
                  <small>Target Network (L2)</small>
                </div>
              </div>
            </div>

            {/* Dynamic Fee Breakdown */}
            <div className="fee-breakdown-card">
              <div className="fee-header">
                <strong>Dynamic Estimated Fees</strong>
                <DemoBadge label="SIMULATED GAS" variant="subtle" />
              </div>
              <div className="detail-row">
                <span>Source L1 Gas ({selectedRoute.baseGasUnits.toLocaleString()} units)</span>
                <strong>${fees.sourceGasFeeUsd} <small>({fees.sourceGasFeeEth} ETH)</small></strong>
              </div>
              <div className="detail-row">
                <span>Bridge Relayer Protocol Fee ({selectedRoute.relayerFeeBps} bps)</span>
                <strong>${fees.relayerFeeUsd}</strong>
              </div>
              <div className="detail-row">
                <span>Destination L2 Execution Gas</span>
                <strong>${fees.destinationGasFeeUsd}</strong>
              </div>
              <div className="detail-row">
                <span>Estimated Slippage Protection Buffer</span>
                <strong>${fees.slippageBufferUsd}</strong>
              </div>
              <div className="detail-row total-row">
                <span>Total Estimated Cost</span>
                <strong className="accent-total">${fees.totalFeeUsd} <small>(~{fees.totalFeeEth} ETH)</small></strong>
              </div>
            </div>

            {/* Risk Summary Vector */}
            <div className={`route-risk-box risk-border-${selectedRoute.riskProfile.level.toLowerCase()}`}>
              <div className="risk-box-header">
                <ShieldIcon style={{ width: 16, height: 16 }} />
                <strong>Architecture: {selectedRoute.riskProfile.architectureType}</strong>
              </div>
              <p className="risk-lead">{riskAnalysis.highlights[0]}</p>
              <p className="risk-subtext">{selectedRoute.riskProfile.summary}</p>
              {riskAnalysis.primaryWarning && (
                <div className="warning-banner">
                  <AlertTriangleIcon style={{ width: 15, height: 15 }} />
                  <span>{riskAnalysis.primaryWarning}</span>
                </div>
              )}
            </div>

            {/* Simulation Trigger Button */}
            <button
              type="button"
              className="action-button-highlight"
              onClick={() => onStartSimulation(selectedRoute, amount, destinationAddress)}
            >
              <span>Test Route in 4-Stage Simulator</span>
              <ZapIcon style={{ width: 16, height: 16 }} />
            </button>
          </article>

          {/* Security Alert Feed */}
          <article className="panel security-feed-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">SIMULATED SECURITY MONITOR</p>
                <h2>Live Ecosystem Feed</h2>
              </div>
              <DemoBadge label="TESTNET FEED" variant="subtle" />
            </div>
            <div className="security-feed-list">
              <div className="feed-item safe">
                <CheckCircleIcon className="feed-icon green" style={{ width: 16, height: 16 }} />
                <div>
                  <strong>Arbitrum Canonical Rollup: Nitro Sequencer healthy</strong>
                  <small>No reorg or inbox delay flags detected on Sepolia.</small>
                </div>
              </div>
              <div className="feed-item safe">
                <CheckCircleIcon className="feed-icon green" style={{ width: 16, height: 16 }} />
                <div>
                  <strong>Across Protocol: Relayer liquidity bond pools balanced</strong>
                  <small>UMA optimistic oracle response time benchmark: 85 seconds.</small>
                </div>
              </div>
              <div className="feed-item warning">
                <AlertTriangleIcon className="feed-icon amber" style={{ width: 16, height: 16 }} />
                <div>
                  <strong>Legacy Wrapped Bridge: Centralization warning</strong>
                  <small>Demo reminder: 3-of-5 admin multi-sig with zero timelock delay.</small>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
