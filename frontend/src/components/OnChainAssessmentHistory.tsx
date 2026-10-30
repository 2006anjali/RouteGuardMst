import { useEffect, useState } from 'react'
import { ExternalLinkIcon } from './Icons'
import { fetchAssessmentHistory } from '../services/assessmentHistory'
import { MST_CORAL_EXPLORER_URL } from '../services/routeAssessment'
import { ROUTEGUARD_CONTRACT_ADDRESS } from '../services/onChainAssessment'
import type { OnChainAssessmentRecord } from '../types/assessment'

export function OnChainAssessmentHistory() {
  const [records, setRecords] = useState<OnChainAssessmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refreshHistory() {
    setIsLoading(true)
    setError(null)
    try {
      setRecords(await fetchAssessmentHistory())
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Unable to read assessment history from MST Coral.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshHistory()
  }, [])

  return (
    <section className="panel assessment-history-panel" aria-labelledby="assessment-history-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">MST CORAL TESTNET · LIVE READ-ONLY DATA</p>
          <h2 id="assessment-history-title">On-Chain Assessment History</h2>
        </div>
        <button type="button" className="on-chain-refresh" onClick={() => void refreshHistory()} disabled={isLoading}>
          {isLoading ? 'Reading...' : 'Refresh'}
        </button>
      </div>

      <p className="assessment-history-disclaimer">
        These are assessment values submitted to RouteGuard by callers. The contract stores the data; it does not independently verify bridge security.
      </p>

      {error ? (
        <p className="assessment-history-error" role="alert">Could not load assessment history: {error}</p>
      ) : isLoading && records.length === 0 ? (
        <p className="assessment-history-state" role="status">Reading assessment records from the public MST Coral RPC...</p>
      ) : records.length === 0 ? (
        <p className="assessment-history-state" role="status">No on-chain assessment records were found for this contract.</p>
      ) : (
        <div className="assessment-history-list">
          {records.map((record) => (
            <article key={record.id} className="assessment-history-record">
              <div className="assessment-history-record-heading">
                <div>
                  <span className="assessment-history-id">Assessment #{record.id}</span>
                  <h3>{record.routeName}</h3>
                </div>
                <span className={`assessment-history-approval ${record.approved ? 'approved' : 'not-approved'}`}>
                  {record.approved ? 'Approved' : 'Not approved'}
                </span>
              </div>
              <dl className="assessment-history-fields">
                <div><dt>Risk score</dt><dd>{record.riskScore}/100</dd></div>
                <div><dt>Assessor</dt><dd className="assessment-history-mono">{record.assessor}</dd></div>
                <div>
                  <dt>Timestamp</dt>
                  <dd>{new Date(Number(record.timestamp) * 1000).toLocaleString()}</dd>
                </div>
                {record.blockNumber != null && <div><dt>Block number</dt><dd>{record.blockNumber}</dd></div>}
                <div><dt>Contract</dt><dd className="assessment-history-mono">{ROUTEGUARD_CONTRACT_ADDRESS}</dd></div>
                <div className="assessment-history-transaction">
                  <dt>Transaction hash</dt>
                  <dd className="assessment-history-mono">
                    {record.transactionHash ?? 'Unavailable from matching contract event logs'}
                  </dd>
                </div>
              </dl>
              {record.transactionHash && (
                <a
                  className="assessment-history-explorer"
                  href={`${MST_CORAL_EXPLORER_URL}/tx/${record.transactionHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLinkIcon style={{ width: 13, height: 13 }} /> View transaction
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}