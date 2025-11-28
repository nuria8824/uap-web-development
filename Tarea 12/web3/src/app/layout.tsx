"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/wagmiConfig";
import { createWeb3Modal } from "@web3modal/wagmi/react";

const queryClient = new QueryClient();
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
console.log("WalletConnect Project ID: ", projectId);

const metadata = {
  name: "Faucet Token DApp",
  description: "Tu DApp Faucet",
  url: "http://localhost:3000", // URL de tu DApp
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

createWeb3Modal({
  wagmiConfig,
  projectId,
  metadata,
  enableAnalytics: false,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="">
      <body className="bg-background text-foreground">
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            {children}
          </WagmiProvider>
        </QueryClientProvider>
      </body>
    </html>
    
  );
}
