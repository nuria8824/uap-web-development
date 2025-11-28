// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   console.log("✅ Recibida solicitud en /api/chat");

//   try {
//     const { message } = await req.json();

//     // Validación básica
//     if (!message || typeof message !== "string") {
//       return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
//     }

//     // Llamada al modelo en OpenRouter
//     const response = await fetch(`${process.env.OPENROUTER_BASE_URL}/chat/completions`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         "HTTP-Referer": "http://localhost:3000", // opcional pero recomendado
//         "X-Title": "Mi Chat con OpenRouter",      // opcional
//       },
//       body: JSON.stringify({
//         model: process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct",
//         messages: [
//           { role: "system", content: "Sos un asistente útil y amable." },
//           { role: "user", content: message },
//         ],
//       }),
//     });

//     const data = await response.json();
//     console.log("🧠 Respuesta de OpenRouter:", data);

//     // Manejo de error del lado de OpenRouter
//     if (data.error) {
//       return NextResponse.json({ error: data.error.message }, { status: data.error.code || 400 });
//     }

//     // Extraer el contenido del mensaje del asistente
//     const aiMessage = data.choices?.[0]?.message?.content || "No se recibió respuesta.";

//     return NextResponse.json({ content: aiMessage });
//   } catch (error) {
//     console.error("💥 Error en el servidor del chat:", error);
//     return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
//   }
// }

import { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "edge";

// Schema de validación estricta para mensajes
const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string()
    .min(1, "El contenido no puede estar vacío")
    .max(4000, "El contenido excede el límite de 4000 caracteres")
    .transform((val) => val.trim()), // Sanitización básica
});

const requestSchema = z.object({
  messages: z.array(messageSchema)
    .min(1, "Debe haber al menos un mensaje")
    .max(100, "Demasiados mensajes en la conversación"),
});

/**
 * POST /api/chat
 * Endpoint seguro para comunicación con OpenRouter
 * 
 * Seguridad:
 * - API key solo en backend (variables de entorno)
 * - Validación estricta con Zod
 * - Sanitización de inputs
 * - Rate limiting (a implementar en producción)
 * - Edge runtime para mejor rendimiento
 */
export async function POST(req: NextRequest) {
  try {
    // Validar variables de entorno
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY no está configurada");
      return new Response(
        JSON.stringify({ 
          error: "Configuración del servidor incorrecta. Contacta al administrador." 
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!process.env.OPENROUTER_BASE_URL) {
      console.error("OPENROUTER_BASE_URL no está configurada");
      return new Response(
        JSON.stringify({ 
          error: "Configuración del servidor incorrecta. Contacta al administrador." 
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parsear y validar el body de la request
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Request body inválido. Debe ser JSON válido." }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validar con Zod
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Validación fallida:", validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: "Datos inválidos", 
          details: validationResult.error.issues.map((e: any) => e.message).join(", ")
        }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = validationResult.data;

    // Sanitización adicional: filtrar mensajes vacíos o demasiado cortos
    const sanitizedMessages = messages
      .filter(msg => msg.content.length > 0)
      .map(msg => ({
        role: msg.role,
        content: msg.content.slice(0, 4000), // Forzar límite
      }));

    if (sanitizedMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay mensajes válidos para procesar" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = process.env.OPENROUTER_MODEL || "google/gemma-2-9b-it:free";

    console.log(`[Chat API] Procesando ${sanitizedMessages.length} mensajes con modelo ${model}`);
    console.log(`[Chat API] Mensajes:`, JSON.stringify(sanitizedMessages, null, 2));

    // Preparar mensajes en formato OpenAI (con system message)
    const formattedMessages = [
      {
        role: "system",
        content: "Eres un asistente útil, amigable y seguro. Responde en español con claridad y precisión. No generes contenido dañino, ofensivo o inapropiado."
      },
      ...sanitizedMessages
    ];

    // Hacer llamada directa a OpenRouter usando formato OpenAI
    const openRouterResponse = await fetch(`${process.env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_APP_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "Chatbot-NextJS",
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error(`[Chat API] Error de OpenRouter:`, errorText);
      throw new Error(`Error ${openRouterResponse.status}: ${errorText}`);
    }

    console.log(`[Chat API] Stream iniciado correctamente`);
    
    // Retornar el stream directamente
    return new Response(openRouterResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
    
  } catch (err: any) {
    console.error("[Chat API] Error:", err);
    
    // No exponer detalles internos del error al cliente
    const errorMessage = err?.message?.includes("API key") 
      ? "Error de autenticación con el servicio de IA"
      : "Error al procesar tu solicitud. Por favor, intenta nuevamente.";
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}