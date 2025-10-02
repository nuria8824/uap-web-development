import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import { FAUCET_TOKEN_ABI } from "@/lib/faucetAbi";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 401 });

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const body = await req.json();
    const { address } = body;
    const userAddress = decoded.address;

    if (address.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json({ error: "Dirección no autorizada" }, { status: 403 });
    }

    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: "Configuración del servidor incorrecta" }, { status: 500 });
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const contractAddress = process.env.CONTRACT_ADDRESS as string;
    const contract = new ethers.Contract(contractAddress, FAUCET_TOKEN_ABI, wallet);

    const hasClaimed = await contract.hasAddressClaimed(address);
    if (hasClaimed) {
      return NextResponse.json({ error: "Ya reclamaste tus tokens" }, { status: 400 });
    }

    const tx = await contract.claimTokens();
    await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      message: "Tokens reclamados exitosamente",
    });
  } catch (err: any) {
    console.error("❌ Error al reclamar tokens:", err.message);
    return NextResponse.json({ error: "Error al reclamar tokens" }, { status: 500 });
  }
}
