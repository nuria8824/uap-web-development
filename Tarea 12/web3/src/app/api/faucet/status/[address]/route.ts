import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";

export async function GET(req: NextRequest, { params }: { params: { address: string } }) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 401 });

    try {
      jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { address } = params;
    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");

    const contractABI = [
      "function balanceOf(address account) view returns (uint256)",
      "function hasAddressClaimed(address user) view returns (bool)",
      "function getFaucetAmount() view returns (uint256)",
      "function getFaucetUsers() view returns (address[])",
    ];
    const contractAddress = process.env.CONTRACT_ADDRESS as string;
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    const balance = await contract.balanceOf(address);
    const hasClaimed = await contract.hasAddressClaimed(address);
    const faucetAmount = await contract.getFaucetAmount();
    const usersList = await contract.getFaucetUsers();

    return NextResponse.json({
      balance: ethers.formatEther(balance),
      hasClaimed,
      faucetAmount: ethers.formatEther(faucetAmount),
      users: usersList,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Error al consultar estado del faucet" }, { status: 500 });
  }
}
