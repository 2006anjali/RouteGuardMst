import { describe, expect, it, vi } from 'vitest'
import { selectMetaMaskProvider, type InjectedWalletProvider } from './walletProvider'

function makeProvider(isMetaMask: boolean): InjectedWalletProvider {
  return { isMetaMask, request: vi.fn() }
}

describe('MetaMask provider selection', () => {
  it('selects MetaMask from a multi-provider injection', () => {
    const otherWallet = makeProvider(false)
    const metaMask = makeProvider(true)
    const injected = { ...otherWallet, providers: [otherWallet, metaMask] }

    expect(selectMetaMaskProvider(injected)).toBe(metaMask)
  })

  it('uses the injected provider when it identifies itself as MetaMask', () => {
    const metaMask = makeProvider(true)

    expect(selectMetaMaskProvider(metaMask)).toBe(metaMask)
  })

  it('does not treat a non-MetaMask injected wallet as MetaMask', () => {
    expect(selectMetaMaskProvider(makeProvider(false))).toBeUndefined()
    expect(selectMetaMaskProvider(undefined)).toBeUndefined()
  })
})