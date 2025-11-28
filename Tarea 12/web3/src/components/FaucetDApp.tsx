"use client"

import React, { useState, useEffect } from "react"
import { useAccount, useConnect } from "wagmi"
import { useWeb3Modal } from "@web3modal/react"

export default function FaucetDApp() {
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()
  // const { connect, connectors } = useConnect()
  // const metaMaskConnector = connectors.find(c => c.id === "injected")

  const [mounted, setMounted] = useState(false)
  const [jwt, setJwt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [faucetData, setFaucetData] = useState<any>(null)
  const [claiming, setClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)

  // Se monta el componente
  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      const storedJwt = localStorage.getItem("jwt")
      if (storedJwt) setJwt(storedJwt)
    }
  }, [])

  useEffect(() => {
    if (jwt && address) fetchFaucetStatus()
  }, [jwt, address])

  const handleSignIn = async () => {
    if (!address) return
    setError(null)
    setLoading(true)
    try {
      const resMsg = await fetch(`/api/auth/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })
      const data = await resMsg.json()
      console.log("Data del mensaje siwe: ", data);
      const message = data.message
      console.log("message del siwe: ", message);
      if (!message) throw new Error("No se recibió mensaje SIWE")

      const signature = await (window.ethereum as any).request({
        method: "personal_sign",
        params: [message, address],
      })

      const resSign = await fetch(`/api/auth/signIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      })

      const signinData = await resSign.json()
      if (signinData.token) {
        setJwt(signinData.token)
        localStorage.setItem("jwt", signinData.token)
      } else {
        setError(signinData.error || "Error de autenticación")
      }
    } catch (err: any) {
      console.error("Error SIWE:", err)
      setError("Error en el proceso de autenticación")
    }
    setLoading(false)
  }

  const fetchFaucetStatus = async () => {
    if (!jwt || !address) return
    try {
      const res = await fetch(`/api/faucet/status/${address}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      })
      const data = await res.json()
      if (res.ok) setFaucetData(data)
      else {
        if (res.status === 401) handleLogout()
        setError(data.error || "Error al consultar estado del faucet")
      }
    } catch (err) {
      console.error(err)
      setError("Error al consultar estado del faucet")
    }
  }

  const handleClaimTokens = async () => {
    if (!jwt || !address) return
    setClaiming(true)
    setError(null)
    setClaimSuccess(null)
    try {
      const res = await fetch(`/api/faucet/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      })
      const data = await res.json()
      if (res.ok) {
        setClaimSuccess(`¡Tokens reclamados! TX: ${data.txHash}`)
        fetchFaucetStatus()
      } else {
        setError(data.error || "Error al reclamar tokens")
      }
    } catch (err) {
      console.error(err)
      setError("Error al reclamar tokens")
    }
    setClaiming(false)
  }

  const handleLogout = () => {
    setJwt(null)
    setFaucetData(null)
    setError(null)
    setClaimSuccess(null)
    if (typeof window !== "undefined") localStorage.removeItem("jwt")
  }

  // Evitamos renderizar hasta que el cliente esté montado
  if (!mounted) return null

  return (
    <div className="min-h-screen bg-blue-700 flex flex-col items-center py-8">
      <h1 className="text-4xl font-bold text-black mb-8">Faucet Token DApp</h1>
      <div className="w-full max-w-xl grid grid-cols-1 gap-6">
        {/* Wallet */}
        <div className="bg-yellow-400 rounded-lg shadow p-6 flex flex-col justify-center">
          <p className="text-lg font-semibold text-black">Wallet conectada:</p>
          <code className="block text-black break-all">{address || "No conectada"}</code>
          {!isConnected ? (
            <button
              onClick={() => open()}
              className="bg-blue-700 text-black font-semibold px-6 py-2 rounded hover:bg-blue-800 transition mt-4"
            >
              Conectar Wallet
            </button>
          ) : (
            <button
              onClick={() => open({ view: 'Account' })} 
              className="bg-gray-500 text-white font-semibold px-6 py-2 rounded hover:bg-gray-600 transition mt-4"
            >
              Abrir Configuración de Wallet
            </button>
          )}
        </div>

        {/* Autenticación */}
        <div className="bg-yellow-400 rounded-lg shadow p-6 flex flex-col justify-center">
          {!jwt ? (
            <button
              onClick={handleSignIn}
              disabled={loading || !isConnected}
              className="bg-blue-700 text-black font-semibold px-6 py-2 rounded hover:bg-blue-800 transition"
            >
              {loading ? "Autenticando..." : "Sign-In with Ethereum"}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-green-700 font-semibold">¡Autenticación exitosa!</p>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white font-semibold px-4 py-2 rounded hover:bg-red-700 transition text-sm"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

        {/* Faucet info */}
        {jwt && faucetData && (
          <div className="bg-yellow-400 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-black mb-4">Estado del Faucet</h2>
            <div className="space-y-2 text-black">
              <p><strong>Balance:</strong> {faucetData.balance} FTK</p>
              <p><strong>Cantidad por reclamo:</strong> {faucetData.faucetAmount} FTK</p>
              <p><strong>Ya reclamaste:</strong> {faucetData.hasClaimed ? "Sí" : "No"}</p>
              <p><strong>Total de usuarios:</strong> {faucetData.users?.length || 0}</p>
            </div>
          </div>
        )}

        {/* Reclamar tokens */}
        {jwt && faucetData && (
          <div className="bg-yellow-400 rounded-lg shadow p-6 flex flex-col justify-center">
            <button
              onClick={handleClaimTokens}
              disabled={claiming || faucetData.hasClaimed}
              className="bg-blue-700 text-black font-semibold px-6 py-2 rounded hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {claiming
                ? "Reclamando tokens..."
                : faucetData.hasClaimed
                ? "Ya reclamaste tus tokens"
                : `Reclamar ${faucetData.faucetAmount} FTK`}
            </button>
          </div>
        )}

        {/* Mensajes */}
        {error && <div className="bg-red-200 rounded-lg p-4 text-red-700 font-semibold">{error}</div>}
        {claimSuccess && <div className="bg-green-200 rounded-lg p-4 text-green-700 font-semibold">{claimSuccess}</div>}
      </div>
    </div>
  )
}
