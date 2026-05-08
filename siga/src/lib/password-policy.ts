export interface PasswordValidation {
  valid: boolean
  error?: string
}

export function validatePassword(password: string): PasswordValidation {
  if (password.length < 8)
    return { valid: false, error: 'A senha deve ter pelo menos 8 caracteres.' }
  if (!/[A-Z]/.test(password))
    return { valid: false, error: 'A senha deve conter pelo menos uma letra maiúscula.' }
  if (!/[0-9]/.test(password))
    return { valid: false, error: 'A senha deve conter pelo menos um número.' }
  return { valid: true }
}
