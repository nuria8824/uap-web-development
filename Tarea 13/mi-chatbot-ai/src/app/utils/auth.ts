import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, AuthResponse } from '@/app/types/auth';

// En un proyecto real, esto debería estar en variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'mi-secreto-super-seguro';
const JWT_EXPIRES_IN = '24h';

// Almacenamiento simulado de usuarios (en producción usar una base de datos)
let users: User[] = [];

/**
 * Genera un hash seguro para la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verifica si una contraseña coincide con el hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Genera un token JWT
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica un token JWT
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Valida un email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida una contraseña
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'La contraseña es demasiado larga' };
  }

  // Requerir al menos una letra y un número
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { valid: false, error: 'La contraseña debe contener al menos una letra y un número' };
  }

  return { valid: true };
}

/**
 * Registra un nuevo usuario
 */
export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  try {
    // Validar email
    if (!validateEmail(email)) {
      return { success: false, error: 'Email inválido' };
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    // Verificar si el usuario ya existe
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return { success: false, error: 'El email ya está registrado' };
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);

    // Crear nuevo usuario
    const newUser: User = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date()
    };

    users.push(newUser);

    // Generar token
    const token = generateToken(newUser.id);

    // Retornar respuesta sin la contraseña
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      success: true,
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Error en registro:', error);
    return { success: false, error: 'Error al registrar usuario' };
  }
}

/**
 * Inicia sesión de un usuario
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    // Validar email
    if (!validateEmail(email)) {
      return { success: false, error: 'Email inválido' };
    }

    // Buscar usuario
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    // Generar token
    const token = generateToken(user.id);

    // Retornar respuesta sin la contraseña
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, error: 'Error al iniciar sesión' };
  }
}

/**
 * Obtiene un usuario por ID
 */
export function getUserById(userId: string): Omit<User, 'password'> | null {
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Guarda el token en localStorage
 */
export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth-token', token);
  }
}

/**
 * Obtiene el token desde localStorage
 */
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth-token');
  }
  return null;
}

/**
 * Elimina el token del localStorage
 */
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-token');
  }
}

/**
 * Verifica si hay un usuario autenticado
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  const decoded = verifyToken(token);
  return decoded !== null;
}

/**
 * Obtiene el usuario actual
 */
export function getCurrentUser(): Omit<User, 'password'> | null {
  const token = getToken();
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return getUserById(decoded.userId);
}