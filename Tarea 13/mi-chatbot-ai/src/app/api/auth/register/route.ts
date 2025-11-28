import { NextRequest, NextResponse } from 'next/server';
import { registerUser, validateEmail, validatePassword } from '@/app/utils/auth';
import { RegisterRequest } from '@/app/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();

    const { email, password, confirmPassword } = body;

    // Validar que todos los campos estén presentes
    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todos los campos son requeridos',
          field: !email ? 'email' : !password ? 'password' : 'confirmPassword'
        },
        { status: 400 }
      );
    }

    // Validar formato del email
    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email inválido',
          field: 'email'
        },
        { status: 400 }
      );
    }

    // Validar longitud del email
    if (email.length > 254) {
      return NextResponse.json(
        {
          success: false,
          error: 'El email es demasiado largo (máximo 254 caracteres)',
          field: 'email'
        },
        { status: 400 }
      );
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: passwordValidation.error,
          field: 'password'
        },
        { status: 400 }
      );
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Las contraseñas no coinciden',
          field: 'confirmPassword'
        },
        { status: 400 }
      );
    }

    // Registrar usuario
    const result = await registerUser(email, password);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          field: result.error?.includes('email') ? 'email' : 'general'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en API de registro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor. Por favor, intenta nuevamente.',
        field: 'general'
      },
      { status: 500 }
    );
  }
}