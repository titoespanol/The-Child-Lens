# Child Lens Landing Page - Versión Estática para GitHub Pages

## Project Overview
Proyecto convertido de Next.js a un sitio web **100% estático** listo para GitHub Pages. Originalmente una landing page de Next.js 15, ahora es un sitio estático sin dependencias de servidor.

## 🎯 Conversión Completada (Octubre 2025)
- ✅ Next.js convertido a exportación estática
- ✅ Todos los archivos HTML/CSS/JS pre-generados
- ✅ Carpeta `/dist` lista para GitHub Pages
- ✅ Sin dependencias de servidor (Node.js, Express)
- ✅ Assets multimedia en Firebase Storage (externo)
- ✅ Configurado basePath `/The-Child-Lens` para GitHub Pages

## Tech Stack

### Versión Estática (Actual)
- **Output**: HTML/CSS/JavaScript estáticos
- **Framework Original**: Next.js 15.3.3 (compilado)
- **Language**: TypeScript (compilado a JavaScript)
- **Styling**: Tailwind CSS 3.4 (compilado)
- **UI Components**: Radix UI (compilado)
- **Animations**: CSS + Framer Motion (cliente)

### Dependencias de Desarrollo (Solo para re-compilar)
- Node.js 20
- Next.js 15.3.3
- TypeScript 5.6.3
- Tailwind CSS 3.4

## Project Structure

```
/
├── dist/                    # ⭐ CARPETA PARA GITHUB PAGES
│   ├── index.html          # Página principal estática
│   ├── 404.html            # Página de error 404
│   ├── .nojekyll           # Bypass Jekyll en GitHub Pages
│   ├── CNAME               # Dominio personalizado (vacío)
│   ├── _next/              # Assets compilados (JS, CSS, fonts)
│   │   ├── static/css/     # Tailwind compilado
│   │   ├── static/chunks/  # JavaScript compilado
│   │   └── static/media/   # Fuentes optimizadas
│   ├── data/               # JSON estático (si se necesita)
│   ├── logotcl.png         # Logo local
│   └── README.md           # Instrucciones de despliegue
│
├── src/                     # Código fuente (para desarrollo)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── lib/placeholder-images.json
│   ├── components/
│   │   ├── ui/             # Shadcn UI components
│   │   └── ...             # Componentes personalizados
│   ├── hooks/
│   └── lib/
│
├── public/                  # Assets originales
├── package.json             # Solo para desarrollo/re-compilación
├── next.config.js          # Config: output: 'export'
└── README.md               # Documentación principal
```

## Key Features (Preservadas en Versión Estática)

### Landing Page Sections
1. **Hero Section**: Animación de texto "Child Lens"
2. **Scrolling Words**: Palabras dinámicas en scroll
3. **Features Section**: Highlights con scroll
4. **Revealing Text**: Texto progresivo en scroll
5. **Science to Systems**: Metodología
6. **Who We Are**: Presentación del equipo
7. **Mandela Quote**: Video con cita de Mandela
8. **Contact**: Formulario de contacto
9. **Footer**: Footer estilo pixel-art

### Interactive Elements (Funcionan en Estático)
- ✅ Toggle Child Lens con animación de colores
- ✅ Indicadores de scroll suaves
- ✅ Barra de progreso por secciones
- ✅ Patrón boho de fondo
- ✅ Todas las animaciones CSS

### Design System
- **Colors**: 6 colores vibrantes (#d45324, #ffb53a, #f291bc, #419ebf, #f27236, #9c4a79)
- **Fonts**: Sniglet (branding), Helvetica Neue (body)
- **Background**: #f2efe8 (beige cálido)
- **Assets**: Firebase Storage (URLs externas)

## Workflow Actual

### Servidor de Prueba (Desarrollo)
```bash
cd dist && python3 -m http.server 5000
```
- Puerto: 5000
- Propósito: Verificar sitio estático localmente
- No necesario para GitHub Pages

### Re-compilar (Si haces cambios)
```bash
npm install          # Instalar dependencias
npm run build        # Compilar a estático
rm -rf dist/*        # Limpiar dist
cp -r out/* dist/    # Copiar nueva versión
```

## GitHub Pages Deployment

### Método 1: Manual
1. Sube contenido de `/dist` a GitHub
2. Settings → Pages → Deploy from branch
3. Selecciona branch y carpeta `/` (root)
4. Listo: `https://usuario.github.io/repo/`

### Método 2: GitHub Actions (Automático)
Ver `README.md` para workflow YAML completo

## Assets y Media

### Ubicación Actual
- **Imágenes/Videos**: Firebase Storage (URLs externas)
- **Logo**: `/dist/logotcl.png` (local)
- **Fuentes**: Incluidas en `/_next/static/media/`

### Firebase Storage URLs
- Boho Pattern (fondo)
- Video Mandela
- Imágenes del equipo
- Iconos y botones

**Ventaja**: No aumenta tamaño del repositorio, CDN global

## Configuración Next.js (Para Re-compilación)

```javascript
// next.config.js
{
  output: 'export',              // Exportación estática
  basePath: '/The-Child-Lens',   // Base path para GitHub Pages
  images: {
    unoptimized: true,           // Sin optimización servidor
  },
  typescript: {
    ignoreBuildErrors: true,     // Flexibilidad
  }
}
```

## Recent Changes

### Octubre 15, 2025 - Conversión a Estático y Deploy
- ✅ Clonado desde rama `replit` de GitHub
- ✅ Configurado Next.js para export estático
- ✅ Compilado con `npm run build`
- ✅ Organizado en carpeta `/dist`
- ✅ Añadidos `.nojekyll`, `CNAME`, `/data`
- ✅ Creado README con instrucciones GitHub Pages
- ✅ Verificado servidor estático en puerto 5000
- ✅ Desplegado a GitHub: https://github.com/titoespanol/The-Child-Lens
- ✅ Configurado basePath `/The-Child-Lens` para rutas correctas
- ✅ Re-compilado y actualizado dist con rutas corregidas

### Cambios Previos
- Migrado de Firebase Studio a Replit
- Configurado Next.js 15 con TypeScript
- Instaladas todas las dependencias
- Preservados componentes y animaciones

## Deployment Options

### GitHub Pages (Recomendado)
- ✅ Gratis
- ✅ HTTPS automático
- ✅ Dominio personalizado disponible
- ✅ Solo subir `/dist`

### Alternativas
- **Vercel**: Import desde GitHub
- **Netlify**: Drag & drop de `/dist`
- **Cloudflare Pages**: Deploy automático
- **Cualquier CDN**: Subir archivos estáticos

## Current Status
✅ **Conversión Estática Completada**
- Sitio 100% estático sin servidor
- Todos los archivos en `/dist` listos
- Servidor de prueba funcionando (puerto 5000)
- Assets externos (Firebase) cargando correctamente
- Todas las animaciones funcionales
- Responsive y optimizado

## Archivos Importantes

### Para GitHub Pages
- `/dist/*` - **TODO el contenido a subir**
- `/dist/.nojekyll` - Evita Jekyll
- `/dist/CNAME` - Dominio personalizado
- `/dist/README.md` - Instrucciones

### Para Desarrollo
- `package.json` - Dependencias
- `next.config.js` - Configuración
- `/src` - Código fuente
- `README.md` - Documentación principal

## Notes
- ✅ Sin servidor Node.js necesario
- ✅ Sin APIs o backend
- ✅ Todo pre-renderizado como HTML
- ✅ JavaScript solo para interactividad cliente
- ✅ Compatible con GitHub Pages out-of-the-box
- ✅ Imágenes sin optimización (unoptimized: true)
- ✅ Assets multimedia en CDN externo (Firebase)

## Next Steps

1. **Desplegar a GitHub Pages**:
   ```bash
   cd dist
   git init
   git add .
   git commit -m "Deploy to GitHub Pages"
   git remote add origin [tu-repo]
   git push -u origin main
   ```

2. **Activar GitHub Pages** en Settings

3. **(Opcional) Configurar dominio personalizado** editando `CNAME`

---

**Estado**: ✅ Listo para producción en GitHub Pages
