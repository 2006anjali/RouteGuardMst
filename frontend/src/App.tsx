import { useState, useEffect } from 'react'
import './App.css'
import type { Route } from './types/route'
import type { TrackedTransaction } from './types/transaction'
import { DEMO_ROUTES, INITIAL_TRANSACTIONS } from './services/mockData'
import { calculateRouteFees } from './services/feeCalculator'
import { DemoDisclaimerBanner } from './components/DemoBanner'
import { OverviewTab } from './pages/OverviewTab'
import { RouteComparisonTab } from './pages/RouteComparisonTab'
import { TransactionTrackerTab } from './pages/TransactionTrackerTab'
import { SecurityCenterTab } from './pages/SecurityCenterTab'
import { ShieldIcon, LayersIcon, ZapIcon, LockIcon, ChevronDownIcon } from './components/Icons'

export function App() {
  const [activePage, setActivePage] = useState<string>('Overview')
  const [routes] = useState<Route[]>(DEMO_ROUTES)
  const [selectedRouteId, setSelectedRouteId] = useState<number>(1)
  const [amount, setAmount] = useState<string>('0.1')
  const [destinationAddress, setDestinationAddress] = useState<string>('')
  const [transactions, setTransactions] = useState<TrackedTransaction[]>(INITIAL_TRANSACTIONS)
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>('tx-rg-9042')
  const [selectedNetwork, setSelectedNetwork] = useState<string>('Ethereum Sepolia')

  // Wallet State
  const [walletAccount, setWalletAccount] = useState<string | null>(null)
  const [walletMessage, setWalletMessage] = useState<string>('Wallet not connected')

  // Listen to MetaMask account changes if window.ethereum exists
  useEffect(() => {
    const eth = (window as Window & { ethereum?: { on?: (event: string, handler: (accounts: string[]) => void) => void } }).ethereum
    if (eth?.on) {
      eth.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAccount(accounts[0])
          setWalletMessage(`Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`)
        } else {
          setWalletAccount(null)
          setWalletMessage('Wallet disconnected')
        }
      })
    }
  }, [])

  async function connectWallet() {
    const eth = (window as Window & {
      ethereum?: {
        request: (args: { method: string }) => Promise<string[]>
      }
    }).ethereum

    if (!eth) {
      // Graceful fallback for testnet prototype: connect simulated demo wallet
      const mockAddress = '0x71C849B231998502B215E9330B58482EaEb149B2'
      setWalletAccount(mockAddress)
      setWalletMessage(`Demo Wallet: ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`)
      return
    }

    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' })
      if (accounts[0]) {
        setWalletAccount(accounts[0])
        setWalletMessage(`Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`)
      } else {
        setWalletMessage('No account returned from wallet')
      }
    } catch {
      setWalletMessage('Connection cancelled or rejected.')
    }
  }

  function disconnectWallet() {
    setWalletAccount(null)
    setWalletMessage('Wallet disconnected')
  }

  // Handle launching a new simulation from any tab
  const handleStartSimulation = (route: Route, transferAmount: string, destAddr: string) => {
    const fees = calculateRouteFees(route, transferAmount)
    const randomHex = () => Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    const newId = `tx-rg-${Math.floor(1000 + Math.random() * 9000)}`
    const sourceTx = `0x${randomHex()}`

    const newTx: TrackedTransaction = {
      id: newId,
      routeId: route.id,
      routeName: route.name,
      protocol: route.protocolName,
      fromChain: route.fromChain,
      toChain: route.toChain,
      amount: transferAmount || '0.1',
      token: route.fromToken,
      estimatedFeeUsd: fees.totalFeeUsd,
      destinationAddress: destAddr.trim() || '0x71C...49b2',
      status: 'in_progress',
      currentStage: 'source_initiated',
      progressPercent: 25,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      sourceTxHash: sourceTx,
      destinationTxHash: '',
      isDemo: true,
      stages: [
        {
          id: 'source_initiated',
          title: 'Source Chain Deposit',
          description: `User signed deposit of ${transferAmount || '0.1'} ${route.fromToken} on ${route.fromChain}.`,
          chain: route.fromChain,
          txHash: `${sourceTx.slice(0, 8)}...${sourceTx.slice(-6)}`,
          completedAt: 'Just now',
          isSimulated: true,
        },
        {
          id: 'relayer_inflight',
          title: 'Relayer In-Flight & Proof Generation',
          description: `${route.protocolName} verifiers validating attestation proof.`,
          chain: 'Relayer Network',
          isSimulated: true,
        },
        {
          id: 'destination_executed',
          title: 'Destination Execution',
          description: `Releasing assets on ${route.toChain}.`,
          chain: route.toChain,
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
          message: `Simulated transfer initialized via ${route.name}. Total estimated fee: $${fees.totalFeeUsd}`,
          type: 'info',
        },
      ],
    }

    setTransactions((prev) => [newTx, ...prev])
    setActiveTransactionId(newId)
    setActivePage('Transactions')
  }

  const handleUpdateTransaction = (updatedTx: TrackedTransaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)))
  }

  const handleAddTransaction = (newTx: TrackedTransaction) => {
    setTransactions((prev) => [newTx, ...prev])
  }

  const inFlightCount = transactions.filter((t) => t.status === 'in_progress').length

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon-wrapper">
            <ShieldIcon className="brand-shield" style={{ width: 20, height: 20 }} />
            <span className="brand-dot" />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <strong>RouteGuard</strong>
              <span className="brand-tag">v1.0</span>
            </div>
            <span className="brand-sub">CROSS-CHAIN SECURITY</span>
          </div>
        </div>

        <div className="nav-label">INTELLIGENCE SUITE</div>
        <nav className="sidebar-nav">
          {[
            { name: 'Overview', icon: <LayersIcon style={{ width: 17, height: 17 }} /> },
            { name: 'Route Analysis', icon: <ZapIcon style={{ width: 17, height: 17 }} /> },
            { name: 'Transactions', icon: <ShieldIcon style={{ width: 17, height: 17 }} />, badge: inFlightCount },
            { name: 'Security Center', icon: <LockIcon style={{ width: 17, height: 17 }} />, dot: true },
          ].map((item) => {
            const isActive = activePage === item.name
            return (
              <button
                key={item.name}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActivePage(item.name)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-title">{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="nav-badge">{item.badge} In-Flight</span>
                )}
                {item.dot && <span className="nav-status-dot" />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="network-card">
            <div className="network-card-header">
              <span className="pulse-indicator" />
              <strong>Sandbox Environment</strong>
            </div>
            <p className="network-card-desc">Connected to Sepolia testnet simulation pool (Chain ID 11155111).</p>
          </div>

          <div className="profile-card">
            <div className="avatar-chip">RG</div>
            <div className="profile-info">
              <strong>Buildathon Auditor</strong>
              <span>Security Analyst Tier</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Bar with Navigation and Wallet Connect */}
        <header className="topbar">
          <div className="breadcrumbs">
            <span className="breadcrumb-root">RouteGuard Console</span>
            <span className="breadcrumb-separator">/</span>
            <strong className="breadcrumb-current">{activePage}</strong>
          </div>

          <div className="top-actions">
            {/* Network Selector Pill */}
            <div className="network-selector-pill">
              <span className="network-dot" />
              <select
                className="network-select"
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                aria-label="Select source blockchain network"
              >
                <option value="Ethereum Sepolia">Ethereum Sepolia (L1)</option>
                <option value="Arbitrum Sepolia">Arbitrum Sepolia (L2)</option>
                <option value="Base Sepolia">Base Sepolia (L2)</option>
                <option value="Polygon Amoy">Polygon Amoy (PoS)</option>
              </select>
              <ChevronDownIcon style={{ width: 12, height: 12, opacity: 0.6 }} />
            </div>

            <span className="demo-pill">TESTNET SIMULATION</span>

            {/* Wallet Connect Button */}
            {walletAccount ? (
              <div className="wallet-connected-group">
                <button
                  type="button"
                  className="wallet-button connected"
                  title={`${walletMessage} (Click to disconnect)`}
                  onClick={disconnectWallet}
                >
                  <span className="wallet-status-dot" />
                  <span className="wallet-address">{walletAccount.slice(0, 6)}...{walletAccount.slice(-4)}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="wallet-button"
                title={walletMessage}
                onClick={connectWallet}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        {/* Global Demo Disclaimer Banner */}
        <DemoDisclaimerBanner />

        {/* Dynamic Page Header */}
        <section className="page-heading">
          <div className="page-heading-content">
            <p className="eyebrow">CROSS-CHAIN SECURITY &amp; ROUTE VERIFICATION</p>
            <h1>
              {activePage === 'Overview' && 'Security Intelligence Overview'}
              {activePage === 'Route Analysis' && 'Cross-Chain Route Comparison'}
              {activePage === 'Transactions' && '4-Stage Lifecycle Simulator'}
              {activePage === 'Security Center' && 'Protocol Security Center'}
            </h1>
            <p className="subtitle">
              {activePage === 'Overview' &&
                'Real-time risk scoring, bridge architecture evaluation, and dynamic fee estimation across testnet routes.'}
              {activePage === 'Route Analysis' &&
                'Side-by-side comparison of canonical rollups, intent relayers, and DVN bridges with explainable risk breakdown.'}
              {activePage === 'Transactions' &&
                'Track simulated cross-chain transactions across deposit confirmation, relayer attestation, and finality.'}
              {activePage === 'Security Center' &&
                'In-depth guide to bridge trust models, historical attack vectors, and address verification hygiene.'}
            </p>
          </div>
          <div className="date-chip">BUILDATHON PREVIEW · TEST DATA</div>
        </section>

        {/* Render Tab Views */}
        <div className="tab-viewport">
          {activePage === 'Overview' && (
            <OverviewTab
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
              amount={amount}
              onChangeAmount={setAmount}
              destinationAddress={destinationAddress}
              onChangeDestinationAddress={setDestinationAddress}
              walletAccount={walletAccount}
              transactions={transactions}
              onNavigateTab={setActivePage}
              onStartSimulation={handleStartSimulation}
            />
          )}

          {activePage === 'Route Analysis' && (
            <RouteComparisonTab
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
              amount={amount}
              onChangeAmount={setAmount}
              destinationAddress={destinationAddress}
              onStartSimulation={handleStartSimulation}
            />
          )}

          {activePage === 'Transactions' && (
            <TransactionTrackerTab
              transactions={transactions}
              activeTransactionId={activeTransactionId}
              onSelectTransaction={setActiveTransactionId}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              routes={routes}
              selectedRouteId={selectedRouteId}
              amount={amount}
              destinationAddress={destinationAddress}
            />
          )}

          {activePage === 'Security Center' && <SecurityCenterTab />}
        </div>

        {/* Global Footer */}
        <footer className="footer">
          <div className="footer-left">
            <strong>RouteGuard</strong>
            <span className="footer-separator">•</span>
            <span>Cross-Chain Security Intelligence Platform</span>
            <span className="footer-separator">•</span>
            <span>Buildathon 2026 Edition</span>
          </div>
          <div className="footer-right">
            <span>All metrics and routes are simulated benchmarks for testnet preview. Verify on official block explorers before mainnet execution.</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App
