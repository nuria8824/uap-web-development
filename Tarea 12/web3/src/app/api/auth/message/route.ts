import { NextRequest, NextResponse } from "next/server";
import { SiweMessage, generateNonce } from "siwe";

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "Address requerida" }, { status: 400 });
    }

    const domain = req.headers.get("host") || "localhost:3000";

    const siweMessage = new SiweMessage({
      domain,
      address,
      // statement: "Inicia sesión en el Faucet DApp",
      uri: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      version: "1",
      chainId: 11155111, // sepolia
      nonce: generateNonce(),
    });

    const messageStr = siweMessage.prepareMessage();
    console.log("🔹 Mensaje SIWE generado:\n", messageStr);

    return NextResponse.json({ message: siweMessage.prepareMessage() });
  } catch (err: any) {
    console.error("❌ Error al crear mensaje SIWE:", err.message);
    return NextResponse.json({ error: "Error al crear el mensaje SIWE" }, { status: 500 });
  }
}
