import { useState } from 'react'
import { DemoBadge } from '../components/DemoBanner'
import { validateEvmAddress } from '../services/riskEngine'
import { OnChainAssessmentHistory } from '../components/OnChainAssessmentHistory'
import {
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  LayersIcon,
  InfoIcon,
} from '../components/Icons'

export function SecurityCenterTab() {
  const [testAddress, setTestAddress] = useState('')
  const [addressResult, setAddressResult] = useState<{ isValid: boolean; message: string } | null>(null)
  const [checklist, setChecklist] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: false,
    4: false,
  })

  const handleValidate = (addr: string) => {
    setTestAddress(addr)
    if (addr.trim()) {
      setAddressResult(validateEvmAddress(addr))
    } else {
      setAddressResult(null)
    }
  }

  const toggleCheck = (id: number) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const passedCount = Object.values(checklist).filter(Boolean).length
  const totalCount = 4

  return (
    <div className="tab-container">
      {/* Header */}
      <section className="security-intro-panel panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">CROSS-CHAIN DEFENSE PROTOCOL</p>
            <h2>Security Intelligence Center &amp; Threat Taxonomy</h2>
            <p className="subtitle">
              Comprehensive reference of cross-chain trust models, bridge attack vectors, and automated validation rules. Benchmarked for buildathon evaluation.
            </p>
          </div>
          <div className="security-header-badges">
            <span className="security-tag-verified">
              <CheckCircleIcon style={{ width: 13, height: 13 }} />
              Security Reference Rules
            </span>
            <DemoBadge label="OFFLINE INTELLIGENCE" variant="accent" />
          </div>
        </div>
      </section>

      <OnChainAssessmentHistory />

      <p className="security-reference-note">
        The taxonomy, threat classes, checklist, and address format checker below are reference/offline features. They are not contract-verified security findings.
      </p>

      {/* Two Column Grid */}
      <div className="content-grid">
        {/* Left Column: Bridge Architecture Taxonomy */}
        <div className="left-column">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">TAXONOMY &amp; TRUST MODELS</p>
                <h2>Bridge Architecture Archetypes</h2>
              </div>
              <LayersIcon style={{ width: 18, height: 18, color: '#10b981' }} />
            </div>

            <div className="arch-guide-cards">
              <div className="arch-card arch-card-safe">
                <div className="arch-card-header">
                  <div className="arch-card-title-group">
                    <span className="arch-badge-safe">CRYPTO PROOF</span>
                    <strong>1. Native Canonical Rollup Bridge</strong>
                  </div>
                  <span className="risk-tag-pill risk-low">Lowest Risk · Tier A+</span>
                </div>
                <p>
                  <strong>Trust Model:</strong> Verified directly by Ethereum Layer 1 consensus. Fraud proofs (Optimistic) or validity proofs (ZK-Rollup) ensure collateral is released only if the L2 state is provably sound.
                </p>
                <div className="arch-card-meta">
                  <span>Reference: Arbitrum Nitro Inbox, OP Stack Portal</span>
                  <span className="meta-tag">Trustless L1-L2 Escape Hatch</span>
                </div>
              </div>

              <div className="arch-card arch-card-safe">
                <div className="arch-card-header">
                  <div className="arch-card-title-group">
                    <span className="arch-badge-intent">INTENT RFQ</span>
                    <strong>2. Intent &amp; Private Relayer Networks</strong>
                  </div>
                  <span className="risk-tag-pill risk-low">Low Risk · Tier A</span>
                </div>
                <p>
                  <strong>Trust Model:</strong> Solvers front destination liquidity immediately from their own balance. Solvers take execution risk, settled optimistically and governed by dispute bonds (e.g. UMA Oracle).
                </p>
                <div className="arch-card-meta">
                  <span>Reference: Across Protocol V3</span>
                  <span className="meta-tag">Fastest (~1–2 min settlement)</span>
                </div>
              </div>

              <div className="arch-card arch-card-medium">
                <div className="arch-card-header">
                  <div className="arch-card-title-group">
                    <span className="arch-badge-dvn">DVN QUORUM</span>
                    <strong>3. Decentralized Verifier Networks (DVN)</strong>
                  </div>
                  <span className="risk-tag-pill risk-medium">Medium Risk · Tier B</span>
                </div>
                <p>
                  <strong>Trust Model:</strong> Cross-chain packets require cryptographic confirmation from a configurable quorum of independent verifier networks (e.g. Google Cloud DVN, Polyhedra, LayerZero Labs).
                </p>
                <div className="arch-card-meta">
                  <span>Reference: LayerZero V2 / Stargate V2</span>
                  <span className="meta-tag">Configurable Security Quorum</span>
                </div>
              </div>

              <div className="arch-card arch-card-danger">
                <div className="arch-card-header">
                  <div className="arch-card-title-group">
                    <span className="arch-badge-custody">CUSTODIAL MULTI-SIG</span>
                    <strong>4. Centralized Multi-Sig Wrapped Minting</strong>
                  </div>
                  <span className="risk-tag-pill risk-high">High Risk Warning · Tier D</span>
                </div>
                <p>
                  <strong>Trust Model:</strong> Centralized operators lock tokens on L1 and mint wrapped representations on target chains via 3-of-5 or 5-of-9 private signer keys. Signer compromise leads to total loss of locked collateral.
                </p>
                <div className="arch-card-meta danger-meta">
                  <span>Historical Exploit Context: Over $2.5B drained in 2021–2023 (Ronin, Nomad, Harmony)</span>
                </div>
              </div>
            </div>
          </article>

          {/* Major Historical Exploit Vectors */}
          <article className="panel" style={{ marginTop: 18 }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">ATTACK VECTOR AUDITING</p>
                <h2>Top Cross-Chain Vulnerability Classes</h2>
              </div>
              <AlertTriangleIcon style={{ width: 18, height: 18, color: '#f59e0b' }} />
            </div>

            <div className="threat-grid">
              <div className="threat-card">
                <div className="threat-header">
                  <span className="threat-severity crit">CRITICAL</span>
                  <strong>Signer Key Exfiltration</strong>
                </div>
                <p>Private keys of bridge validator nodes compromised via social engineering or cloud server intrusion.</p>
              </div>

              <div className="threat-card">
                <div className="threat-header">
                  <span className="threat-severity high">HIGH</span>
                  <strong>Un-Timelocked Proxies</strong>
                </div>
                <p>Bridge smart contract logic can be modified instantly by an admin multi-sig with zero public delay.</p>
              </div>

              <div className="threat-card">
                <div className="threat-header">
                  <span className="threat-severity high">HIGH</span>
                  <strong>Message Proof Forgery</strong>
                </div>
                <p>Incomplete verification of cross-chain Merkle root signatures allowing spoofed deposit execution.</p>
              </div>

              <div className="threat-card">
                <div className="threat-header">
                  <span className="threat-severity med">MEDIUM</span>
                  <strong>Liquidity AMM Depegging</strong>
                </div>
                <p>Slippage exploitation and oracle manipulation on decentralized bridge liquidity pool reserves.</p>
              </div>
            </div>
          </article>
        </div>

        {/* Right Column: Pre-Transfer Checklist and Address Checker */}
        <div className="right-column">
          {/* Interactive Pre-Transfer Safety Checklist */}
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">HYGIENE VERIFICATION</p>
                <h2>Pre-Transfer Safety Checklist</h2>
              </div>
              <CheckCircleIcon style={{ width: 18, height: 18, color: '#10b981' }} />
            </div>

            <p className="field-help" style={{ marginBottom: 16 }}>
              Review these security rules before approving or signing any cross-chain transaction in your wallet.
            </p>

            <div className="checklist-items">
              <label className="checklist-item" onClick={() => toggleCheck(1)}>
                <input
                  type="checkbox"
                  checked={checklist[1] || false}
                  onChange={() => {}}
                />
                <div>
                  <strong>1. Verify Official Bridge URL &amp; Domain</strong>
                  <small>Protect against DNS hijacking or lookalike phishing domains.</small>
                </div>
              </label>

              <label className="checklist-item" onClick={() => toggleCheck(2)}>
                <input
                  type="checkbox"
                  checked={checklist[2] || false}
                  onChange={() => {}}
                />
                <div>
                  <strong>2. Confirm Destination Network &amp; Token Standard</strong>
                  <small>Ensure the target chain accepts native tokens or standard rollups.</small>
                </div>
              </label>

              <label className="checklist-item" onClick={() => toggleCheck(3)}>
                <input
                  type="checkbox"
                  checked={checklist[3] || false}
                  onChange={() => {}}
                />
                <div>
                  <strong>3. Inspect Wallet Allowance Parameters</strong>
                  <small>Never grant unlimited token approvals to experimental or unaudited bridge contracts.</small>
                </div>
              </label>

              <label className="checklist-item" onClick={() => toggleCheck(4)}>
                <input
                  type="checkbox"
                  checked={checklist[4] || false}
                  onChange={() => {}}
                />
                <div>
                  <strong>4. Check Timelock &amp; Governance Status</strong>
                  <small>Verify that contracts cannot be changed arbitrarily while funds are in transit.</small>
                </div>
              </label>
            </div>

            <div className="checklist-score-card">
              <div className="checklist-score-meta">
                <span>Security Readiness:</span>
                <strong>{passedCount} / {totalCount} Checks Verified</strong>
              </div>
              <div className="checklist-meter">
                <div
                  className="checklist-meter-fill"
                  style={{ width: `${(passedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          </article>

          {/* Interactive EVM Contract Address Inspector */}
          <article className="panel" style={{ marginTop: 18 }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">SYNTAX VERIFICATION</p>
                <h2>Address Format Checker</h2>
              </div>
              <ShieldIcon style={{ width: 18, height: 18, color: '#06b6d4' }} />
            </div>

            <label htmlFor="sec-address-check" className="checker-label">
              Test Destination / Contract Address:
            </label>
            <div className="checker-input-wrapper">
              <input
                id="sec-address-check"
                type="text"
                placeholder="Enter 0x... EVM address"
                value={testAddress}
                onChange={(e) => handleValidate(e.target.value)}
                className="checker-input"
              />
            </div>

            {addressResult && (
              <div className={`checker-result-box ${addressResult.isValid ? 'valid' : 'invalid'}`}>
                <strong>{addressResult.isValid ? '✓ Valid EVM Address Format' : '⚠ Validation Warning'}</strong>
                <p>{addressResult.message}</p>
              </div>
            )}

            <div className="demo-notice-subtle">
              <InfoIcon style={{ width: 14, height: 14 }} />
              <span>RouteGuard prototype performs offline RFC-55-compliant checksum and hex format checks without making external RPC calls.</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
