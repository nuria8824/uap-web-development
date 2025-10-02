import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();

    if (!message || !signature) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    // Si la verificación es correcta
    const address = fields.data.address;
    const token = jwt.sign({ address }, process.env.JWT_SECRET as string, { expiresIn: "1h" });

    return NextResponse.json({ token, address });
  } catch (err: any) {
    console.error("❌ Error al verificar SIWE:", err.message);
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }
}
