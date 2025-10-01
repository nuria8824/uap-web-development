import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json({ error: "Address requerida" }, { status: 400 });
    }

    const nonce = Math.random().toString(36).substring(2, 10);
    const issuedAt = new Date().toISOString();

    const messageString = [
      "localhost wants you to sign in with your Ethereum account:",
      address,
      "",
      "Inicia sesión en el Faucet DApp",
      "",
      "URI: http://localhost:3000",
      "Version: 1",
      "Chain ID: 11155111",
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
    ].join("\n");

    return NextResponse.json({ message: messageString });
  } catch (err: any) {
    console.error("❌ Error al crear mensaje SIWE:", err.message);
    return NextResponse.json({ error: "Error al crear el mensaje SIWE" }, { status: 500 });
  }
}
