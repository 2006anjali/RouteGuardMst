import { useEffect, useRef, useState } from 'react'
import {
  fetchOnChainAssessment,
  MST_CORAL_CHAIN_ID,
  type OnChainAssessmentData,
} from '../services/onChainAssessment'
import { getMetaMaskProvider } from '../services/walletProvider'

type MetaMaskStatus = 'checking' | 'connected' | 'wrong-network' | 'unavailable' | 'error'

export function OnChainAssessmentPanel() {
  const [data, setData] = useState<OnChainAssessmentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [readError, setReadError] = useState<string | null>(null)
  const [metaMaskStatus, setMetaMaskStatus] = useState<MetaMaskStatus>('checking')
  const [walletChainId, setWalletChainId] = useState<string | null>(null)
  const networkCheckId = useRef(0)

  async function refreshPanel() {
    const currentCheckId = ++networkCheckId.current
    setIsLoading(true)
    setReadError(null)

    const wallet = getMetaMaskProvider()
    if (!wallet) {
      setMetaMaskStatus('unavailable')
      setWalletChainId(null)
    } else {
      setMetaMaskStatus('checking')
      try {
        const chainId = await wallet.request({ method: 'eth_chainId' })
        if (networkCheckId.current === currentCheckId) {
          const parsedChainId = BigInt(chainId as string)
          setWalletChainId(parsedChainId.toString())
          setMetaMaskStatus(parsedChainId === MST_CORAL_CHAIN_ID ? 'connected' : 'wrong-network')
        }
      } catch {
        if (networkCheckId.current === currentCheckId) {
          setMetaMaskStatus('error')
        }
      }
    }

    try {
      setData(await fetchOnChainAssessment())
    } catch (error) {
      setReadError(error instanceof Error ? error.message : 'Unable to read the assessment from MST Coral.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const wallet = getMetaMaskProvider()
    const updateChain = (chainId: string[] | string) => {
      networkCheckId.current += 1
      if (typeof chainId !== 'string') {
        setWalletChainId(null)
        setMetaMaskStatus('error')
        return
      }
      try {
        const parsedChainId = BigInt(chainId)
        setWalletChainId(parsedChainId.toString())
        setMetaMaskStatus(parsedChainId === MST_CORAL_CHAIN_ID ? 'connected' : 'wrong-network')
      } catch {
        setWalletChainId(null)
        setMetaMaskStatus('error')
      }
    }

    wallet?.on?.('chainChanged', updateChain)
    void refreshPanel()

    return () => {
      networkCheckId.current += 1
      wallet?.removeListener?.('chainChanged', updateChain)
    }
  }, [])

  const networkMessage = {
    checking: 'Checking MetaMask network...',
    connected: 'MetaMask is connected to MST Coral (Chain ID 54635).',
    'wrong-network': `Wrong network: MetaMask is on Chain ID ${walletChainId ?? 'unknown'}. Select MST Coral (Chain ID 54635) in MetaMask to match this contract.`,
    unavailable: 'MetaMask was not detected. Assessment data is still read directly from the Coral RPC.',
    error: 'Could not verify MetaMask network. Assessment data is still read directly from the Coral RPC.',
  }[metaMaskStatus]

  return (
    <section className="panel on-chain-assessment" aria-labelledby="on-chain-assessment-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">MST CORAL TESTNET · READ ONLY</p>
          <h2 id="on-chain-assessment-title">On-Chain Assessment</h2>
        </div>
        <button type="button" className="on-chain-refresh" onClick={() => void refreshPanel()} disabled={isLoading}>
          {isLoading ? 'Reading...' : 'Refresh'}
        </button>
      </div>

      <div className={`on-chain-network-status ${metaMaskStatus}`} role="status" aria-live="polite">
        <span className="on-chain-status-dot" />
        <span>{networkMessage}</span>
      </div>

      {readError ? (
        <p className="on-chain-read-error" role="alert">Could not load on-chain data: {readError}</p>
      ) : isLoading && !data ? (
        <p className="on-chain-loading" role="status">Reading assessment 1 from MST Coral...</p>
      ) : data ? (
        <>
          <dl className="on-chain-details">
            <div className="on-chain-detail">
              <dt>Assessment ID</dt>
              <dd>{data.assessment.id}</dd>
            </div>
            <div className="on-chain-detail">
              <dt>Route Name</dt>
              <dd>{data.assessment.routeName}</dd>
            </div>
            <div className="on-chain-detail">
              <dt>Risk Score</dt>
              <dd>{data.assessment.riskScore}/100</dd>
            </div>
            <div className="on-chain-detail">
              <dt>Approval</dt>
              <dd className={data.assessment.approved ? 'on-chain-approved' : 'on-chain-rejected'}>
                {data.assessment.approved ? 'Approved' : 'Not approved'}
              </dd>
            </div>
            <div className="on-chain-detail">
              <dt>Report Hash</dt>
              <dd className="on-chain-mono">{data.assessment.reportHash}</dd>
            </div>
            <div className="on-chain-detail">
              <dt>Assessor</dt>
              <dd className="on-chain-mono">{data.assessment.assessor}</dd>
            </div>
            <div className="on-chain-detail">
              <dt>Timestamp</dt>
              <dd>
                {new Date(Number(data.assessment.timestamp) * 1000).toLocaleString()}
                <span className="on-chain-timestamp"> Unix: {data.assessment.timestamp}</span>
              </dd>
            </div>
            <div className="on-chain-detail">
              <dt>Next Assessment ID</dt>
              <dd>{data.nextAssessmentId}</dd>
            </div>
          </dl>
          <p className="on-chain-contract-address">Contract: 0x980aD38BbD4059499290DA1a460f886d20755411</p>
        </>
      ) : null}
    </section>
  )
}