# The Child Lens - Versión Estática para GitHub Pages

Este proyecto ha sido convertido desde Next.js a un sitio web **100% estático** listo para ser desplegado en **GitHub Pages**.

## 📋 Resumen de la Conversión

✅ **Completado**: Conversión exitosa de Node.js/Next.js a sitio estático  
✅ **Sin servidor**: No requiere Node.js, Express ni ninguna dependencia de backend  
✅ **GitHub Pages Ready**: Toda la carpeta `/dist` está lista para desplegar  

## 🚀 Despliegue Rápido en GitHub Pages

### Paso 1: Crear Repositorio en GitHub
1. Crea un nuevo repositorio en GitHub
2. No inicialices con README (ya está incluido)

### Paso 2: Subir el Contenido de /dist

```bash
cd dist
git init
git add .
git commit -m "Deploy static site to GitHub Pages"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### Paso 3: Activar GitHub Pages
1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main` → Folder: `/ (root)`
5. Save

Tu sitio estará en: `https://TU_USUARIO.github.io/TU_REPO/`

## 📁 Estructura del Proyecto

```
/
├── dist/                    # ⭐ CARPETA PRINCIPAL - Subir a GitHub Pages
│   ├── index.html          # Página principal
│   ├── 404.html            # Página de error
│   ├── .nojekyll           # Evita procesamiento Jekyll
│   ├── CNAME               # Dominio personalizado (opcional)
│   ├── _next/              # Assets optimizados (JS, CSS, fonts)
│   ├── data/               # Datos JSON estáticos
│   ├── logotcl.png         # Logo
│   └── README.md           # Instrucciones de despliegue
│
├── src/                     # Código fuente original (Next.js)
├── public/                  # Assets originales
├── package.json             # Dependencias (solo para desarrollo)
└── next.config.js          # Configuración Next.js (export)
```

## ✨ Características de la Versión Estática

### ✅ Lo que se Eliminó
- ❌ Servidor Node.js (Express, etc.)
- ❌ Dependencias de servidor/backend
- ❌ API endpoints dinámicos
- ❌ Server-side rendering (SSR)

### ✅ Lo que se Conservó
- ✅ Todo el contenido HTML, CSS, JavaScript
- ✅ Componentes React (compilados a JS estático)
- ✅ Todas las animaciones y interacciones
- ✅ Diseño responsive completo
- ✅ Assets multimedia (alojados en Firebase Storage)

### 📦 Assets Incluidos
- **HTML**: index.html, 404.html (pre-renderizados)
- **CSS**: Tailwind compilado y optimizado
- **JavaScript**: React/Next.js compilado (cliente)
- **Imágenes/Videos**: URLs externas de Firebase Storage
- **Fuentes**: Sniglet, Helvetica Neue (optimizadas)

## 🌐 Dominio Personalizado

Para usar tu propio dominio:

1. **Edita** `dist/CNAME`:
   ```
   www.tudominio.com
   ```

2. **Configura DNS** en tu proveedor:
   - Tipo: `CNAME`
   - Nombre: `www`
   - Valor: `TU_USUARIO.github.io`

3. O usa **registros A** (dominio raíz):
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

## 🔄 GitHub Actions (Despliegue Automático)

Para despliegue automático, crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 🛠️ Re-construir desde el Código Fuente

Si necesitas modificar el sitio:

```bash
# Instalar dependencias
npm install

# Hacer cambios en /src

# Re-compilar estático
npm run build

# Los nuevos archivos estarán en /out
# Copiarlos a /dist
rm -rf dist/*
cp -r out/* dist/
```

## 📊 Comparativa Antes/Después

| Característica | Antes (Next.js) | Después (Estático) |
|----------------|-----------------|-------------------|
| Servidor | Node.js necesario | ❌ Ninguno |
| Despliegue | Vercel, Firebase | GitHub Pages, cualquier CDN |
| Costo | Hosting dinámico | ✅ Gratis (GitHub Pages) |
| Rendimiento | SSR/Hydration | ✅ Instantáneo (solo HTML) |
| Complejidad | Media-Alta | ✅ Baja |

## 🔍 Verificar Localmente

Para probar el sitio estático antes de subir:

```bash
# Con Python
cd dist
python3 -m http.server 8000

# O con Node.js
npx serve dist

# Abrir: http://localhost:8000
```

## 📝 Notas Técnicas

### Imágenes y Videos
- **Ubicación**: Firebase Storage (URLs externas)
- **Ventaja**: No aumenta el tamaño del repositorio
- **CDN**: Firebase proporciona distribución global

### Componentes Next.js
- `next/image` → Exportado con `unoptimized: true`
- `next/link` → Funcional en modo estático
- CSS Modules → Compilados a CSS estático

### Configuración Next.js
```javascript
// next.config.js
{
  output: 'export',        // Exportación estática
  images: {
    unoptimized: true,     // Sin optimización de servidor
  }
}
```

## 🐛 Solución de Problemas

### El sitio no se ve bien en GitHub Pages
- ✅ Verifica que `.nojekyll` existe en `/dist`
- ✅ Asegúrate de desplegar desde `/dist`, no desde `/`

### Las rutas no funcionan
- ✅ GitHub Pages usa la carpeta raíz seleccionada
- ✅ Verifica que subiste TODO el contenido de `/dist`

### Falta el CSS/JavaScript
- ✅ Asegúrate de incluir la carpeta `_next/`
- ✅ No modifiques los nombres de archivos generados

## 📬 Contacto

**The Child Lens**  
- Web: [En construcción]  
- LinkedIn: [The Child Lens](https://www.linkedin.com/company/the-child-lens)

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles

---

**¿Listo para desplegar?** 🚀  
Solo sube la carpeta `/dist` a GitHub y activa GitHub Pages. ¡Es así de simple!
