import { InfoIcon, AlertTriangleIcon } from './Icons'

export function DemoDisclaimerBanner() {
  return (
    <div className="demo-disclaimer-banner" role="region" aria-label="Demo sandbox notice">
      <div className="demo-disclaimer-left">
        <span className="demo-status-pulse" />
        <span className="demo-badge-primary">SIMULATION SANDBOX</span>
        <p className="demo-disclaimer-text">
          <strong>Demo simulation:</strong> Route analysis, mock route data, fee estimates, and transfer lifecycles are simulated. Sepolia is context only; simulated transfers are not blockchain transactions.
        </p>
      </div>
      <div className="demo-disclaimer-right">
        <div className="demo-chain-tag">
          <InfoIcon style={{ width: 13, height: 13 }} />
          <span>Simulated Sepolia Context</span>
        </div>
      </div>
    </div>
  )
}

interface DemoBadgeProps {
  label?: string
  variant?: 'subtle' | 'warning' | 'accent' | 'emerald' | 'cyan'
}

export function DemoBadge({ label = 'DEMO DATA', variant = 'subtle' }: DemoBadgeProps) {
  return (
    <span className={`demo-pill-badge demo-pill-${variant}`}>
      {variant === 'warning' && <AlertTriangleIcon style={{ width: 10, height: 10, marginRight: 4 }} />}
      {label}
    </span>
  )
}
