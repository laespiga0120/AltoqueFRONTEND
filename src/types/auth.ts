// Este archivo define las estructuras de datos para el login.

/**
 * Representa las credenciales que se envían al backend.
 */
export interface LoginCredentials {
  username?: string;
  password?: string;
}

/**
 * Representa la respuesta esperada del backend tras un login exitoso.
 */
export interface LoginResponse {
  token: string;
  // Puedes añadir más propiedades si tu backend las devuelve, como el nombre de usuario.
}
