import { NextRequest, NextResponse } from 'next/server';
import { loginUser, validateEmail } from '@/app/utils/auth';
import { LoginRequest } from '@/app/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    const { email, password } = body;

    // Validar que todos los campos estén presentes
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: !email ? 'El email es requerido' : 'La contraseña es requerida',
          field: !email ? 'email' : 'password'
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
          error: 'El email es demasiado largo',
          field: 'email'
        },
        { status: 400 }
      );
    }

    // Validar longitud de la contraseña
    if (password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          error: 'La contraseña es demasiado larga',
          field: 'password'
        },
        { status: 400 }
      );
    }

    // Iniciar sesión
    const result = await loginUser(email, password);

    if (!result.success) {
      let errorMessage = result.error || 'Error al iniciar sesión';
      let field = 'general';
      
      // Personalizar mensaje según el error
      if (errorMessage.includes('inválidas') || errorMessage.includes('credenciales')) {
        errorMessage = 'Email o contraseña incorrectos';
        field = 'general';
      } else if (errorMessage.includes('email')) {
        field = 'email';
      } else if (errorMessage.includes('contraseña')) {
        field = 'password';
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          field
        },
        { status: 401 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en API de login:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error del servidor. Por favor, intenta nuevamente.',
        field: 'general'
      },
      { status: 500 }
    );
  }
}