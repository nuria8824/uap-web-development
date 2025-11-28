interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const calculateStrength = (password: string): { score: number; message: string; color: string } => {
    let score = 0;
    
    // Longitud
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Complejidad
    if (/[a-z]/.test(password)) score++; // Letras minúsculas
    if (/[A-Z]/.test(password)) score++; // Letras mayúsculas
    if (/[0-9]/.test(password)) score++; // Números
    if (/[^a-zA-Z0-9]/.test(password)) score++; // Caracteres especiales

    if (score <= 2) {
      return { score, message: 'Débil', color: 'bg-red-500' };
    } else if (score <= 4) {
      return { score, message: 'Media', color: 'bg-yellow-500' };
    } else {
      return { score, message: 'Fuerte', color: 'bg-green-500' };
    }
  };

  const strength = calculateStrength(password);
  const percentage = (strength.score / 5) * 100;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Fortaleza de la contraseña</span>
        <span className={`text-xs font-medium ${
          strength.color === 'bg-red-500' ? 'text-red-600' :
          strength.color === 'bg-yellow-500' ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {strength.message}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <p>Usa:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li className={password.length >= 8 ? 'text-green-600' : ''}>
            Al menos 8 caracteres
          </li>
          <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
            Letras minúsculas
          </li>
          <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
            Letras mayúsculas
          </li>
          <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
            Números
          </li>
          <li className={/[^a-zA-Z0-9]/.test(password) ? 'text-green-600' : ''}>
            Caracteres especiales (!@#$%^&*)
          </li>
        </ul>
      </div>
    </div>
  );
}