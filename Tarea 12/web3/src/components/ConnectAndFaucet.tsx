"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { FAUCET_ABI } from "@/lib/faucetAbi";

const CONTRACT_ADDRESS = "0x3e2117c19a921507ead57494bbf29032f33c7412";

export default function ConnectAndFaucet() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  const { data: balance, isLoading: loadingBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  function handleFaucet() {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "claimTokens",
    });
  }

  if (!mounted) return null; // 👈 evita mismatches

  return (
    <div>
      {isConnected ? (
        <>
          <p>Conectado: {address}</p>
          <button onClick={() => disconnect()}>Desconectar</button>

          <button onClick={handleFaucet} disabled={isPending}>
            {isPending ? "Enviando..." : "Pedir tokens"}
          </button>

          {isConfirming && <p>Esperando confirmación...</p>}
          {isConfirmed && (
            <p>
              ✅ Confirmado:{" "}
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
              >
                {hash}
              </a>
            </p>
          )}

          <div>
            <h3>Balance:</h3>
            {loadingBalance ? <p>Cargando...</p> : <p>{String(balance)}</p>}
          </div>
        </>
      ) : (
        <>
          {connectors
          .filter((c) => c.name === "MetaMask" || c.name === "WalletConnect")
          .map((c) => (
            <button
              key={c.id}
              onClick={() => connect({ connector: c })}
            >
              Conectar con ${c.name}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
