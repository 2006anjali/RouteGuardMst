export interface InjectedWalletProvider {
  isMetaMask?: boolean
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (value: string[] | string) => void) => void
  removeListener?: (event: string, handler: (value: string[] | string) => void) => void
  providers?: InjectedWalletProvider[]
}

export function selectMetaMaskProvider(
  injectedProvider?: InjectedWalletProvider,
): InjectedWalletProvider | undefined {
  if (!injectedProvider) return undefined

  return injectedProvider.providers?.find((provider) => provider.isMetaMask)
    ?? (injectedProvider.isMetaMask ? injectedProvider : undefined)
}

export function getMetaMaskProvider(): InjectedWalletProvider | undefined {
  const injected = (window as Window & { ethereum?: InjectedWalletProvider }).ethereum
  return selectMetaMaskProvider(injected)
}