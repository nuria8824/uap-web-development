import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifyMessage } from "ethers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, signature } = body;

    if (!message || !signature) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
    const address = addressMatch ? addressMatch[0] : null;

    if (!address) {
      return NextResponse.json({ error: "Dirección no encontrada en el mensaje" }, { status: 400 });
    }

    const recoveredAddress = verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const token = jwt.sign({ address }, process.env.JWT_SECRET as string, { expiresIn: "1h" });

    return NextResponse.json({ token, address });
  } catch (err: any) {
    console.error("❌ Error al verificar SIWE:", err.message);
    return NextResponse.json({ error: "Error al verificar SIWE" }, { status: 400 });
  }
}
