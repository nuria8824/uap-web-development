import { useState } from 'react'
import { ethers } from 'ethers'
import FaucetTokenABI from '../abis/FaucetToken.json'

const FAUCET_ADDRESS = import.meta.env.VITE_FAUCET_CONTRACT

export function useFaucet(signer: ethers.Signer | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasClaimed, setHasClaimed] = useState<boolean | null>(null)
  const [balance, setBalance] = useState<string>('0')
 const abi = {}
  const contract = signer ? new ethers.Contract(FAUCET_ADDRESS!, FaucetTokenABI, signer) : null

  const checkClaimed = async (address: string) => {
    if (!contract) return
    try {
      const claimed: boolean = await contract.hasAddressClaimed(address)
      setHasClaimed(claimed)
    } catch (err) {
      console.error(err)
    }
  }

  const claimTokens = async () => {
    if (!contract) return
    setLoading(true)
    setError(null)
    try {
      const tx = await contract.claimTokens()
      await tx.wait()
      setHasClaimed(true)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  const getBalance = async (address: string) => {
    if (!contract) return
    const bal = await contract.balanceOf(address)
    setBalance(ethers.utils.formatUnits(bal, 18))
  }

  return { loading, error, hasClaimed, balance, checkClaimed, claimTokens, getBalance }
}
