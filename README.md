Proyecto AlToque - Frontend
Esta es la interfaz de usuario para el sistema de gestión de préstamos "AlToque", desarrollada con React, Vite y TypeScript.

Tecnologías Utilizadas
React 18: Librería principal para la construcción de la interfaz.

Vite: Herramienta de construcción y servidor de desarrollo rápido.

TypeScript: Para un tipado estático y un código más robusto.

Tailwind CSS: Framework de CSS para un diseño rápido y moderno.

Shadcn/ui: Colección de componentes de UI reutilizables.

React Router Dom: Para la gestión de rutas en la aplicación.

Configuración del Entorno
La aplicación se conecta a un backend. Es necesario especificar la URL del servidor en un archivo de variables de entorno.

Crear el archivo .env.local:
En la raíz del proyecto, crea un nuevo archivo llamado .env.local.

Definir la variable de entorno:
Abre el archivo .env.local y añade la siguiente línea, reemplazando la URL por la de tu backend (si es diferente):

VITE_API_URL=http://localhost:8080

Instalación y Ejecución
Instalar dependencias:
Abre una terminal en la raíz del proyecto y ejecuta:

npm install

Iniciar el servidor de desarrollo:
Una vez instaladas las dependencias, inicia la aplicación con:

npm run dev

La aplicación estará disponible en http://localhost:8081 (o el puerto que indique Vite en tu terminal).
