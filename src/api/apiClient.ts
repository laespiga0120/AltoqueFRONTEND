// Definimos la URL base de tu API.
// Es una buena práctica usar variables de entorno para esto.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

// Opciones personalizadas para nuestro cliente.
// Extendemos RequestInit pero permitimos que 'body' sea un objeto JS.
interface CustomRequestInit extends Omit<RequestInit, "body"> {
  body?: Record<string, any>;
}

/**
 * Realiza una petición fetch a la API.
 * @param endpoint El endpoint al que se hará la petición (ej. "/auth/login").
 * @param options Opciones de la petición, incluyendo un 'body' como objeto.
 * @returns La respuesta de la API en formato JSON.
 */
async function client<T>(
  endpoint: string,
  { body, ...customOptions }: CustomRequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("authToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: customOptions.method || (body ? "POST" : "GET"),
    headers: { ...headers, ...customOptions.headers },
    ...customOptions,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText; // Por defecto, usamos el texto crudo del error.

      try {
        // Intentamos interpretar el error como JSON.
        const errorData = JSON.parse(errorText);
        // Si tiene una propiedad 'message', usamos esa. Es más limpia.
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Si no se puede parsear como JSON, no hacemos nada.
        // El 'errorMessage' ya tiene el texto crudo, que es lo correcto en este caso.
        console.error("La respuesta de error no era un JSON válido:", e);
      }

      // Lanzamos el error final con el mensaje que hemos determinado.
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    return Promise.reject(error);
  }
}

export default client;
