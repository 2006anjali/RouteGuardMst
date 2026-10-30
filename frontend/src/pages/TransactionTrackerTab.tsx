import { useState, useEffect, useRef } from 'react'
import type { TrackedTransaction, StageId, ActivityLog } from '../types/transaction'
import type { Route } from '../types/route'
import { calculateRouteFees } from '../services/feeCalculator'
import { createTransactionId } from '../services/transactionId'
import { DemoBadge } from '../components/DemoBanner'
import { fetchAssessmentHistory, getLatestAssessmentRecord } from '../services/assessmentHistory'
import type { OnChainAssessmentRecord } from '../types/assessment'
import {
  ROUTEGUARD_CONTRACT_ADDRESS,
} from '../services/onChainAssessment'
import { MST_CORAL_EXPLORER_URL } from '../services/routeAssessment'
import {
  ShieldIcon,
  ZapIcon,
  ClockIcon,
  CopyIcon,
  CheckIcon,
  SearchIcon,
  InfoIcon,
  RefreshIcon,
  ExternalLinkIcon,
} from '../components/Icons'

interface TransactionTrackerTabProps {
  transactions: TrackedTransaction[]
  activeTransactionId: string | null
  onSelectTransaction: (id: string) => void
  onAddTransaction: (tx: TrackedTransaction) => void
  onUpdateTransaction: (tx: TrackedTransaction) => void
  routes: Route[]
  selectedRouteId: number
  amount: string
  destinationAddress: string
}

export function TransactionTrackerTab({
  transactions,
  activeTransactionId,
  onSelectTransaction,
  onAddTransaction,
  onUpdateTransaction,
  routes,
  selectedRouteId,
  amount,
  destinationAddress,
}: TransactionTrackerTabProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all')
  const [isSimulatingLive, setIsSimulatingLive] = useState(false)
  const detailsPanelRef = useRef<HTMLElement>(null)
  const [pendingInspectId, setPendingInspectId] = useState<string | null>(null)
  const [assessmentTransaction, setAssessmentTransaction] = useState<OnChainAssessmentRecord | null>(null)
  const [assessmentLoading, setAssessmentLoading] = useState(true)
  const [assessmentError, setAssessmentError] = useState<string | null>(null)

  const refreshAssessmentTransaction = async () => {
    setAssessmentLoading(true)
    setAssessmentError(null)
    try {
      const records = await fetchAssessmentHistory()
      setAssessmentTransaction(getLatestAssessmentRecord(records))
    } catch (error) {
      setAssessmentError(error instanceof Error ? error.message : 'Unable to read assessment transaction from MST Coral.')
    } finally {
      setAssessmentLoading(false)
    }
  }

  useEffect(() => {
    void refreshAssessmentTransaction()
  }, [])

  // Find currently active transaction to display in detailed 4-stage view
  const activeTx = transactions.find((t) => t.id === activeTransactionId) ?? transactions[0]

  const handleInspectTransaction = (id: string) => {
    setPendingInspectId(id)
    onSelectTransaction(id)
  }

  useEffect(() => {
    if (pendingInspectId !== activeTransactionId) {
      return
    }

    detailsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setPendingInspectId(null)
  }, [activeTransactionId, pendingInspectId])

  // Copy hash helper with visual feedback
  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopiedHash(text)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  // Live simulation tick effect: advances active transaction if it's in-progress
  useEffect(() => {
    if (!isSimulatingLive || !activeTx || activeTx.status !== 'in_progress') {
      return
    }

    const timer = setInterval(() => {
      const stageSequence: StageId[] = [
        'source_initiated',
        'relayer_inflight',
        'destination_executed',
        'finalized',
      ]
      const currentIndex = stageSequence.indexOf(activeTx.currentStage)

      if (currentIndex < stageSequence.length - 1) {
        const nextStage = stageSequence[currentIndex + 1]
        const progressSteps = [25, 55, 85, 100]
        const newProgress = progressSteps[currentIndex + 1]

        const stageDescriptions: Record<StageId, string> = {
          source_initiated: 'Simulated source step completed; no blockchain transaction was sent.',
          relayer_inflight: 'Simulated relayer progress; no external relayer was contacted.',
          destination_executed: 'Simulated destination step completed; no destination transaction was sent.',
          finalized: 'Demo lifecycle reached its final stage; no on-chain settlement occurred.',
        }

        const newLog: ActivityLog = {
          timestamp: 'Just now',
          stage: nextStage,
          message: stageDescriptions[nextStage],
          type: nextStage === 'finalized' ? 'success' : 'info',
        }

        const updatedStages = activeTx.stages.map((st) => {
          if (st.id === nextStage) {
            return {
              ...st,
              completedAt: 'Just now',
            }
          }
          return st
        })

        const isComplete = nextStage === 'finalized'

        onUpdateTransaction({
          ...activeTx,
          currentStage: nextStage,
          progressPercent: newProgress,
          status: isComplete ? 'completed' : 'in_progress',
          updatedAt: 'Just now',
          stages: updatedStages,
          logs: [newLog, ...activeTx.logs],
        })

        if (isComplete) {
          setIsSimulatingLive(false)
        }
      } else {
        setIsSimulatingLive(false)
      }
    }, 3000)

    return () => clearInterval(timer)
  }, [isSimulatingLive, activeTx, onUpdateTransaction])

  // Start new demo transfer
  const handleLaunchNewTransfer = () => {
    const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? routes[0]
    const fees = calculateRouteFees(selectedRoute, amount)
    const newId = createTransactionId(transactions)

    const newTx: TrackedTransaction = {
      id: newId,
      routeId: selectedRoute.id,
      routeName: selectedRoute.name,
      protocol: selectedRoute.protocolName,
      fromChain: selectedRoute.fromChain,
      toChain: selectedRoute.toChain,
      amount: amount || '0.1',
      token: selectedRoute.fromToken,
      estimatedFeeUsd: fees.totalFeeUsd,
      destinationAddress: destinationAddress.trim() || '0x71C...49b2',
      status: 'in_progress',
      currentStage: 'source_initiated',
      progressPercent: 25,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      sourceTxHash: '',
      destinationTxHash: '',
      isDemo: true,
      stages: [
        {
          id: 'source_initiated',
          title: 'Source Chain Deposit',
          description: `User signed deposit of ${amount || '0.1'} ${selectedRoute.fromToken} on ${selectedRoute.fromChain}.`,
          chain: selectedRoute.fromChain,
          completedAt: 'Just now',
          isSimulated: true,
        },
        {
          id: 'relayer_inflight',
          title: 'Relayer In-Flight & Proof Generation',
          description: `${selectedRoute.protocolName} verifiers validating attestation proof.`,
          chain: 'Relayer Network',
          isSimulated: true,
        },
        {
          id: 'destination_executed',
          title: 'Destination Execution',
          description: `Releasing assets on ${selectedRoute.toChain}.`,
          chain: selectedRoute.toChain,
          isSimulated: true,
        },
        {
          id: 'finalized',
          title: 'Final Settlement Anchor',
          description: 'State root verification completed with cryptographic finality.',
          chain: 'Consensus Final',
          isSimulated: true,
        },
      ],
      logs: [
        {
          timestamp: 'Just now',
          stage: 'source_initiated',
          message: `Simulated transfer initialized via ${selectedRoute.name}. Gas fee: $${fees.totalFeeUsd}`,
          type: 'info',
        },
      ],
    }

    onAddTransaction(newTx)
    onSelectTransaction(newId)
    setIsSimulatingLive(true)
  }

  // Filter transaction list
  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter
    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sourceTxHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.fromChain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.toChain.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Stage sequence mapping for visual stepper
  const stagesOrdered: StageId[] = [
    'source_initiated',
    'relayer_inflight',
    'destination_executed',
    'finalized',
  ]

  return (
    <div className="tab-container">
      {/* Top Banner and Transfer Simulator Launch Bar */}
      <section className="tracker-top-panel panel">
        <div className="tracker-header-row">
          <div>
            <p className="eyebrow">CROSS-CHAIN LIFECYCLE MONITOR</p>
            <h2>4-Stage Transaction Tracker</h2>
            <p className="subtitle">
              Inspect demo-only simulated transfer progress across source, relayer, destination, and settlement stages. Real blockchain transactions are listed separately below.
            </p>
          </div>
          <div className="tracker-actions">
            <button
              type="button"
              className="btn-launch-sim"
              onClick={handleLaunchNewTransfer}
            >
              <ZapIcon style={{ width: 15, height: 15 }} />
              <span>Launch New Simulated Transfer</span>
            </button>
          </div>
        </div>
      </section>

      <section className="panel real-assessment-transaction" aria-labelledby="real-assessment-transaction-title">
        <div className="panel-heading real-assessment-heading">
          <div>
            <p className="eyebrow">REAL MST CORAL TESTNET TRANSACTION</p>
            <h2 id="real-assessment-transaction-title">On-Chain Assessment</h2>
          </div>
          <button
            type="button"
            className="on-chain-refresh"
            onClick={() => void refreshAssessmentTransaction()}
            disabled={assessmentLoading}
          >
            {assessmentLoading ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        {assessmentLoading && !assessmentTransaction ? (
          <p className="assessment-transaction-message" role="status">Reading the latest assessment from MST Coral...</p>
        ) : assessmentError ? (
          <p className="assessment-transaction-error" role="alert">Could not load assessment history: {assessmentError}</p>
        ) : !assessmentTransaction ? (
          <p className="assessment-transaction-message" role="status">No on-chain assessment records were found for this contract.</p>
        ) : (
          <>
            <div className="real-assessment-status status-success" role="status" aria-live="polite">
              Assessment #{assessmentTransaction.id} stored on-chain
              {assessmentTransaction.blockNumber != null && <span>Block {assessmentTransaction.blockNumber}</span>}
            </div>
            <dl className="real-assessment-details">
              <div><dt>Network</dt><dd>MST Coral Testnet (Chain ID 54635)</dd></div>
              <div><dt>Contract</dt><dd className="real-assessment-mono">{ROUTEGUARD_CONTRACT_ADDRESS}</dd></div>
              <div><dt>Assessment ID</dt><dd>{assessmentTransaction.id}</dd></div>
              <div><dt>Route</dt><dd>{assessmentTransaction.routeName}</dd></div>
              <div><dt>Recorded risk score</dt><dd>{assessmentTransaction.riskScore}/100</dd></div>
              <div><dt>Approval</dt><dd>{assessmentTransaction.approved ? 'Approved' : 'Not approved'}</dd></div>
              <div><dt>Assessor</dt><dd className="real-assessment-mono">{assessmentTransaction.assessor}</dd></div>
              <div>
                <dt>Timestamp</dt>
                <dd>
                  {new Date(Number(assessmentTransaction.timestamp) * 1000).toLocaleString()}
                  <span className="on-chain-timestamp"> Unix: {assessmentTransaction.timestamp}</span>
                </dd>
              </div>
              {assessmentTransaction.blockNumber != null && <div><dt>Block number</dt><dd>{assessmentTransaction.blockNumber}</dd></div>}
              <div className="real-assessment-hash-row">
                <dt>Transaction hash</dt>
                <dd className="real-assessment-mono">{assessmentTransaction.transactionHash ?? 'Unavailable from matching contract event logs'}</dd>
              </div>
            </dl>
            {assessmentTransaction.transactionHash && (
              <a
                className="real-assessment-explorer-link"
                href={`${MST_CORAL_EXPLORER_URL}/tx/${assessmentTransaction.transactionHash}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLinkIcon style={{ width: 13, height: 13 }} /> View transaction on MST Coral Explorer
              </a>
            )}
          </>
        )}
      </section>

      {/* Main Tracker Area */}
      {activeTx ? (
        <section ref={detailsPanelRef} className="active-tracker-card panel highlight-border">
          <div className="active-tracker-header">
            <div>
              <div className="tx-meta-chips">
                <span className="tx-id-badge">{activeTx.id}</span>
                <span className={`status-pill status-${activeTx.status}`}>
                  {activeTx.status === 'in_progress' ? '● IN-FLIGHT' : '✓ FINALIZED'}
                </span>
                <span className="protocol-badge">{activeTx.protocol}</span>
                <DemoBadge label="SIMULATED · NO ON-CHAIN TRANSACTION" variant="subtle" />
              </div>
              <h3>
                {activeTx.amount} {activeTx.token} via {activeTx.routeName}
              </h3>
              <p className="active-tx-subtext">
                From <strong>{activeTx.fromChain}</strong> to <strong>{activeTx.toChain}</strong> · Est. Total Fee: ${activeTx.estimatedFeeUsd}
              </p>
            </div>

            <div className="tracker-controls">
              {activeTx.status === 'in_progress' && (
                <button
                  type="button"
                  className={`btn-toggle-sim ${isSimulatingLive ? 'active-pulse' : ''}`}
                  onClick={() => setIsSimulatingLive(!isSimulatingLive)}
                >
                  <RefreshIcon className={isSimulatingLive ? 'spin-icon' : ''} style={{ width: 14, height: 14 }} />
                  <span>{isSimulatingLive ? 'Simulation Running...' : 'Resume Simulation'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar with Percentage and Stage Labels */}
          <div className="progress-bar-container">
            <div className="progress-bar-track">
              <div
                className={`progress-bar-fill ${activeTx.status === 'in_progress' ? 'animate-shimmer' : ''}`}
                style={{ width: `${activeTx.progressPercent}%` }}
              />
            </div>
            <div className="progress-labels">
              <span>Overall State Machine Progress</span>
              <strong className="progress-percent-accent">{activeTx.progressPercent}% Complete</strong>
            </div>
          </div>

          {/* 4-Stage Stepper */}
          <div className="stepper-grid">
            {stagesOrdered.map((stageId, index) => {
              const stageDetail = activeTx.stages.find((s) => s.id === stageId)
              const currentIndex = stagesOrdered.indexOf(activeTx.currentStage)
              const isPast = index < currentIndex || activeTx.status === 'completed'
              const isCurrent = index === currentIndex && activeTx.status !== 'completed'
              const isPending = index > currentIndex && activeTx.status !== 'completed'

              return (
                <div
                  key={stageId}
                  className={`step-card ${isPast ? 'step-completed' : ''} ${isCurrent ? 'step-active' : ''} ${isPending ? 'step-pending' : ''}`}
                >
                  <div className="step-header">
                    <span className="step-number">
                      {isPast ? <CheckIcon style={{ width: 13, height: 13 }} /> : index + 1}
                    </span>
                    <span className="step-chain-tag">{stageDetail?.chain}</span>
                  </div>

                  <strong>{stageDetail?.title}</strong>
                  <p className="step-desc">{stageDetail?.description}</p>

                  <div className="step-footer">
                    {stageDetail?.completedAt ? (
                      <span className="step-time">
                        <ClockIcon style={{ width: 12, height: 12 }} /> {stageDetail.completedAt}
                      </span>
                    ) : isCurrent ? (
                      <span className="step-time active-time">
                        <span className="pulse-ping" /> In progress...
                      </span>
                    ) : (
                      <span className="step-time pending-time">Queued</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Hashes & Verification Bar */}
          <div className="tx-hashes-container">
            <div className="hash-item">
              <div className="hash-header">
                <span className="hash-label">Source Tx Hash ({activeTx.fromChain}):</span>
                <span className="explorer-demo-pill">SIMULATED · NO EXPLORER RECORD</span>
              </div>
              <div className="hash-box">
                <code>{activeTx.sourceTxHash || 'No on-chain transaction hash (simulation only)'}</code>
                {activeTx.sourceTxHash && <button
                    type="button"
                    className="btn-copy-hash"
                    onClick={() => handleCopy(activeTx.sourceTxHash)}
                    title="Copy Hash"
                  >
                    {copiedHash === activeTx.sourceTxHash ? (
                      <CheckIcon style={{ width: 13, height: 13, color: '#10b981' }} />
                    ) : (
                      <CopyIcon style={{ width: 13, height: 13 }} />
                    )}
                  </button>}
              </div>
            </div>

            <div className="hash-item">
              <div className="hash-header">
                <span className="hash-label">Destination Address:</span>
                <span className="explorer-demo-pill">Target Rollup (demo)</span>
              </div>
              <div className="hash-box">
                <code>{activeTx.destinationAddress}</code>
                <button
                  type="button"
                  className="btn-copy-hash"
                  onClick={() => handleCopy(activeTx.destinationAddress)}
                  title="Copy Address"
                >
                  {copiedHash === activeTx.destinationAddress ? (
                    <CheckIcon style={{ width: 13, height: 13, color: '#10b981' }} />
                  ) : (
                    <CopyIcon style={{ width: 13, height: 13 }} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Live Activity Stream */}
          <div className="activity-log-section">
            <div className="log-header">
              <ShieldIcon style={{ width: 15, height: 15 }} />
              <strong>Simulated Verifier &amp; Relayer Activity Log</strong>
              <DemoBadge label="SIMULATED AUDIT TRAIL" variant="subtle" />
            </div>
            <div className="log-entries">
              {activeTx.logs.map((log, i) => (
                <div key={i} className={`log-entry log-${log.type}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-dot" />
                  <span className="log-msg">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Transaction History Table */}
      <section className="tx-history-panel panel">
        <div className="history-header">
          <div>
            <p className="eyebrow">TRANSFER AUDIT HISTORY</p>
            <h2>Simulated Cross-Chain Transfers ({filteredTransactions.length})</h2>
          </div>

          <div className="history-filters">
            <div className="search-box">
              <SearchIcon style={{ width: 14, height: 14 }} />
              <input
                type="text"
                placeholder="Search by ID, route, or hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-buttons">
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All ({transactions.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setStatusFilter('in_progress')}
              >
                In-Flight
              </button>
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                Finalized
              </button>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="table-responsive">
          <table className="tx-table">
            <thead>
              <tr>
                <th>Tx ID</th>
                <th>Route &amp; Protocol</th>
                <th>Route Path</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Stage</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const isSelected = activeTx?.id === tx.id
                return (
                  <tr key={tx.id} className={isSelected ? 'row-selected' : ''}>
                    <td>
                      <code className="table-tx-id">{tx.id}</code>
                    </td>
                    <td>
                      <strong>{tx.routeName}</strong>
                      <small className="table-sub">{tx.protocol}</small>
                    </td>
                    <td>
                      <span className="table-route-path">
                        {tx.fromChain} ➔ {tx.toChain}
                      </span>
                    </td>
                    <td>
                      <strong>{tx.amount} {tx.token}</strong>
                      <small className="table-sub">~${tx.estimatedFeeUsd} fee</small>
                    </td>
                    <td>
                      <span className={`status-pill status-${tx.status}`}>
                        {tx.status === 'in_progress' ? '● In-Flight' : '✓ Finalized'}
                      </span>
                    </td>
                    <td>
                      <span className="stage-chip">{tx.currentStage.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <span className="table-time">{tx.updatedAt}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-inspect"
                        onClick={() => handleInspectTransaction(tx.id)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="empty-history-notice">
            <InfoIcon style={{ width: 16, height: 16 }} />
            <span>No transactions match your search filter.</span>
          </div>
        )}
      </section>
    </div>
  )
}
