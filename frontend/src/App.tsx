import { useState, useEffect } from 'react'
import './App.css'
import type { Route } from './types/route'
import type { TrackedTransaction } from './types/transaction'
import { DEMO_ROUTES, INITIAL_TRANSACTIONS } from './services/mockData'
import { createSimulatedTransaction } from './services/simulatedTransactions'
import { DemoDisclaimerBanner } from './components/DemoBanner'
import { OverviewTab } from './pages/OverviewTab'
import { RouteComparisonTab } from './pages/RouteComparisonTab'
import { TransactionTrackerTab } from './pages/TransactionTrackerTab'
import { SecurityCenterTab } from './pages/SecurityCenterTab'
import { ShieldIcon, LayersIcon, ZapIcon, LockIcon, ChevronDownIcon } from './components/Icons'
import { getMetaMaskProvider } from './services/walletProvider'

function formatWalletNetwork(chainId: string): string {
  const parsedChainId = BigInt(chainId)
  return parsedChainId === 54635n ? 'MST Coral Testnet' : `Chain ID ${parsedChainId}`
}

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
  const [walletNetwork, setWalletNetwork] = useState<string | null>(null)
  const [isDemoWallet, setIsDemoWallet] = useState(false)

  // Track account and network changes from the injected wallet.
  useEffect(() => {
    const eth = getMetaMaskProvider()
    if (eth?.on) {
      const handleAccountsChanged = (accounts: string[] | string) => {
        if (typeof accounts === 'string') return
        if (accounts.length > 0) {
          setWalletAccount(accounts[0])
          setIsDemoWallet(false)
          setWalletMessage(`Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`)
        } else {
          setWalletAccount(null)
          setWalletNetwork(null)
          setWalletMessage('Wallet disconnected')
        }
      }
      const handleChainChanged = (chainId: string[] | string) => {
        if (typeof chainId !== 'string') return
        try {
          const network = formatWalletNetwork(chainId)
          setWalletNetwork(network)
          setWalletMessage(`Connected to ${network}`)
        } catch {
          setWalletNetwork('Network unavailable')
          setWalletMessage('Connected; network unavailable')
        }
      }

      eth.on('accountsChanged', handleAccountsChanged)
      eth.on('chainChanged', handleChainChanged)
      return () => {
        eth.removeListener?.('accountsChanged', handleAccountsChanged)
        eth.removeListener?.('chainChanged', handleChainChanged)
      }
    }
  }, [])

  async function connectWallet() {
    const eth = getMetaMaskProvider()

    if (!eth) {
      // Graceful fallback for testnet prototype: connect simulated demo wallet
      const mockAddress = '0x71C849B231998502B215E9330B58482EaEb149B2'
      setWalletAccount(mockAddress)
      setWalletNetwork(null)
      setIsDemoWallet(true)
      setWalletMessage(`Demo Wallet: ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`)
      return
    }

    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' }) as string[]
      if (accounts[0]) {
        setWalletAccount(accounts[0])
        setIsDemoWallet(false)
        try {
          const chainId = await eth.request({ method: 'eth_chainId' }) as string
          const network = formatWalletNetwork(chainId)
          setWalletNetwork(network)
          setWalletMessage(`Connected to ${network}: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`)
        } catch {
          setWalletNetwork('Network unavailable')
          setWalletMessage(`Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}; network unavailable`)
        }
      } else {
        setWalletMessage('No account returned from wallet')
      }
    } catch {
      setWalletMessage('Connection cancelled or rejected.')
    }
  }

  function disconnectWallet() {
    setWalletAccount(null)
    setWalletNetwork(null)
    setIsDemoWallet(false)
    setWalletMessage('Wallet disconnected')
  }

  // Handle launching a new simulation from any tab
  const handleStartSimulation = (route: Route, transferAmount: string, destAddr: string) => {
    const newTx = createSimulatedTransaction(route, transferAmount, destAddr, transactions)
    setTransactions((prev) => [newTx, ...prev])
    setActiveTransactionId(newTx.id)
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
              <p className="network-card-desc">Simulation context: Ethereum Sepolia (Chain ID 11155111). Route data and transfers are simulated; no Sepolia transaction is sent.</p>
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

            <span className="demo-pill">SIMULATION: ETHEREUM SEPOLIA</span>

            {/* Wallet Connect Button */}
            {walletAccount ? (
              <div className="wallet-connected-group">
                <button
                  type="button"
                  className="wallet-button connected"
                  title={`${walletMessage} (Click to clear the app's local wallet state; MetaMask permissions may remain enabled)`}
                  onClick={disconnectWallet}
                >
                  <span className="wallet-status-dot" />
                  <span className="wallet-address">{walletAccount.slice(0, 6)}...{walletAccount.slice(-4)}</span>
                  <span className="wallet-network-label">{isDemoWallet ? 'Demo wallet' : walletNetwork ?? 'Checking network'}</span>
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
              walletNetwork={walletNetwork}
              isDemoWallet={isDemoWallet}
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
