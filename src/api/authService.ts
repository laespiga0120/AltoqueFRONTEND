import client from "./apiClient";
import { LoginCredentials, LoginResponse } from "@/types/auth";

// La clave que usaremos para guardar el token en el almacenamiento local.
const TOKEN_KEY = "authToken";

/**
 * Servicio para gestionar la autenticación.
 */
export const authService = {
  /**
   * Envía las credenciales al backend para iniciar sesión.
   * Si es exitoso, guarda el token JWT en el localStorage.
   * @param credentials - Objeto con username y password.
   * @returns La respuesta del servidor con el token.
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      // Tu backend espera un objeto con 'username' y 'password'.
      const data = await client<LoginResponse>("/auth/login", {
        method: "POST",
        body: credentials,
        // Sobrescribimos headers para asegurar el Content-Type correcto, aunque apiClient ya lo hace.
        headers: { "Content-Type": "application/json" },
      });

      // Si la petición fue exitosa y tenemos un token, lo guardamos.
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      return data;
    } catch (error) {
      // Limpiamos cualquier token viejo si el login falla.
      localStorage.removeItem(TOKEN_KEY);
      // Relanzamos el error para que el componente lo maneje (ej. mostrar un toast).
      throw error;
    }
  },

  /**
   * Cierra la sesión del usuario eliminando el token.
   */
  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Comprueba si el usuario está autenticado verificando la existencia del token.
   * @returns true si hay un token, false en caso contrario.
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Obtiene el token de autenticación actual.
   * @returns El token o `null` si no existe.
   */
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
};
