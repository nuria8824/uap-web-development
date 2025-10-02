import { useState } from 'react'
import { BrowserProvider, type JsonRpcSigner } from 'ethers'

export function useWallet() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [account, setAccount] = useState<string | null>(null)

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const browserProvider = new BrowserProvider((window as any).ethereum)
        const signer = await browserProvider.getSigner()
        const address = await signer.getAddress()

        setProvider(browserProvider)
        setSigner(signer)
        setAccount(address)
      } catch (err) {
        console.error(err)
      }
    } else {
      alert('MetaMask no está instalado')
    }
  }

  return { provider, signer, account, connectWallet }
}
