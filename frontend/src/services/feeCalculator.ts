import type { Route, FeeBreakdown } from '../types/route'

// Simulated current market conditions for Sepolia testnet demonstration
const ETH_USD_PRICE = 3100
const SOURCE_GAS_PRICE_GWEI = 18
const DEST_GAS_PRICE_GWEI = 0.15

/**
 * Calculates dynamic fee breakdown based on the transfer amount and route parameters.
 * All calculations are transparently estimated and clearly marked as demo values.
 */
export function calculateRouteFees(route: Route, amountEthStr: string): FeeBreakdown {
  const amountEth = parseFloat(amountEthStr) || 0.1

  // Source chain L1 gas cost (in ETH)
  const sourceGasEth = (route.baseGasUnits * SOURCE_GAS_PRICE_GWEI * 1e9) / 1e18
  const sourceGasUsd = sourceGasEth * ETH_USD_PRICE

  // Protocol relayer fee based on basis points (bps) of the amount
  // 1 bps = 0.01%
  const relayerFeeEth = amountEth * (route.relayerFeeBps / 10000)
  const relayerFeeUsd = relayerFeeEth * ETH_USD_PRICE

  // Destination chain L2 execution gas cost (in USD)
  const destGasEth = (route.destinationGasUnits * DEST_GAS_PRICE_GWEI * 1e9) / 1e18
  const destGasUsd = destGasEth * ETH_USD_PRICE

  // Slippage protection buffer estimate (e.g. 0.05% of transferred amount)
  const slippageBufferUsd = Math.max(0.02, amountEth * 0.0005 * ETH_USD_PRICE)

  const totalFeeUsd = sourceGasUsd + relayerFeeUsd + destGasUsd + slippageBufferUsd
  const totalFeeEth = totalFeeUsd / ETH_USD_PRICE

  return {
    sourceGasFeeEth: Number(sourceGasEth.toFixed(6)),
    sourceGasFeeUsd: Number(sourceGasUsd.toFixed(2)),
    relayerFeeUsd: Number(relayerFeeUsd.toFixed(2)),
    destinationGasFeeUsd: Number(destGasUsd.toFixed(3)),
    slippageBufferUsd: Number(slippageBufferUsd.toFixed(2)),
    totalFeeUsd: Number(totalFeeUsd.toFixed(2)),
    totalFeeEth: Number(totalFeeEth.toFixed(5)),
  }
}

