# Guía de Despliegue - Niko-Niko Calendar

Sigue estos pasos para publicar la aplicación en tu propio servidor o hosting.

## Requisitos Previos
- Tener instalado **Node.js** (v18 o superior) en el servidor.
- Acceso a la terminal o panel de control del hosting.
- Cuenta en **MongoDB Atlas** con un cluster creado y una Connection String disponible.

## Pasos para el Despliegue

### 1. Compilar el Frontend (Localmente)
Antes de subir los archivos, genera la versión optimizada ejecutando en tu ordenador local:
```bash
npm run build
```
Esto creará una carpeta llamada `dist/`.

### 2. Configurar Variables de Entorno

La aplicación requiere una variable de entorno con la Connection String de MongoDB Atlas.

**Opción A — Archivo `.env` (desarrollo local o servidores con soporte dotenv):**
Crea un archivo `.env` en la raíz del proyecto:
```env
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/nikoniko?retryWrites=true&w=majority
PORT=3001
```
> ⚠️ **Nunca subas el archivo `.env` a git.**

**Opción B — cPanel (Node.js App):**
En el panel de cPanel, ve a **Setup Node.js App** → selecciona tu app → sección **Environment Variables** y agrega:
- Clave: `MONGODB_URI`
- Valor: tu Connection String completa

### 3. Subir Archivos al Servidor
Copia los siguientes archivos y carpetas a tu servidor:
- `dist/` (Contenido visual compilado)
- `server.js` (Lógica del servidor)
- `package.json` (Configuración de dependencias)
- `package-lock.json`

> Ya **no es necesario** subir `data.json` — los datos se almacenan en MongoDB Atlas.

### 4. Instalar Dependencias (En el Servidor)
Una vez subidos los archivos, abre la terminal en la carpeta del proyecto en el servidor y ejecuta:
```bash
npm install --production
```

### 5. Iniciar la Aplicación
Puedes iniciar el servidor directamente:
```bash
node server.js
```

Deberías ver:
```
Conectado a MongoDB Atlas ✓
Niko-Niko OK en puerto 3001
```

**Recomendado: Usar PM2 (Gestor de Procesos)**
Para que la aplicación no se cierre al cerrar la terminal y se reinicie sola si hay errores:
```bash
npm install -g pm2
pm2 start server.js --name niko-niko
pm2 save
```

## Configuración de Puerto
Por defecto, la app corre en el puerto **3001**. Puedes cambiarlo con la variable de entorno `PORT`:
```env
PORT=8080
```

## Base de Datos — MongoDB Atlas
Los datos se almacenan en la nube en tu cluster de MongoDB Atlas, en la base de datos `nikoniko`, colección `teams`.

Para hacer copias de seguridad, usa la herramienta **Atlas Backup** desde el panel de MongoDB, o exporta con:
```bash
mongodump --uri="<tu MONGODB_URI>" --out=./backup
```
