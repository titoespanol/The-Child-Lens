# 🚀 Guía Rápida de Despliegue a GitHub Pages

## ✅ El Proyecto Está Listo

La carpeta `/dist` contiene **TODO** lo necesario para GitHub Pages:

```
dist/
├── index.html          ← Página principal
├── 404.html           ← Página de error
├── .nojekyll          ← Necesario para GitHub Pages
├── CNAME              ← Para dominio personalizado (editar si necesitas)
├── _next/             ← JavaScript, CSS, fuentes
├── data/              ← Datos estáticos JSON
├── logotcl.png        ← Logo
└── README.md          ← Instrucciones completas
```

## 📤 Opción 1: Despliegue Manual (5 minutos)

### Paso 1: Crear nuevo repositorio en GitHub
- Ve a https://github.com/new
- Nombre: `child-lens` (o el que prefieras)
- **NO** marques "Add a README file"
- Click "Create repository"

### Paso 2: Subir los archivos de /dist

```bash
cd dist
git init
git add .
git commit -m "Initial deployment to GitHub Pages"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### Paso 3: Activar GitHub Pages
1. En tu repo, ve a **Settings** → **Pages**
2. En "Source" selecciona: **Deploy from a branch**
3. En "Branch" selecciona: **main** y **/ (root)**
4. Click **Save**

### ✨ Listo!
Tu sitio estará en: `https://TU_USUARIO.github.io/TU_REPO/`

(Puede tardar 1-2 minutos en aparecer)

---

## 📤 Opción 2: GitHub Desktop (Más Fácil)

1. Descarga [GitHub Desktop](https://desktop.github.com/)
2. File → New Repository
3. Arrastra los archivos de `/dist` a la carpeta del repo
4. Commit y Push
5. Activa Pages en Settings (como arriba)

---

## 🌐 Dominio Personalizado (Opcional)

### Si quieres usar www.tudominio.com:

1. **Edita** `dist/CNAME`:
   ```
   www.tudominio.com
   ```

2. **Configura DNS** en tu proveedor de dominio:
   - Tipo: `CNAME`
   - Nombre: `www`
   - Valor: `TU_USUARIO.github.io`

3. **O usa dominio raíz** (sin www):
   - Tipo: `A` (crear 4 registros)
   - Valores:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```

4. **En GitHub Pages Settings**, escribe tu dominio personalizado y Save

---

## 🔄 Actualizar el Sitio

Para hacer cambios:

```bash
# Opción A: Modificar archivos en /dist directamente
cd dist
# ... hacer cambios ...
git add .
git commit -m "Update site"
git push

# Opción B: Re-compilar desde el código fuente
npm run build
rm -rf dist/*
cp -r out/* dist/
cd dist
git add .
git commit -m "Rebuild site"
git push
```

---

## ❓ Solución de Problemas

### El sitio muestra 404
- ✅ Verifica que subiste **TODO** el contenido de `/dist`
- ✅ Confirma que `.nojekyll` está presente
- ✅ Espera 2-3 minutos después de activar Pages

### Falta CSS/JavaScript
- ✅ No borres ni renombres la carpeta `_next/`
- ✅ Sube TODO incluyendo archivos ocultos (`.nojekyll`)

### Las imágenes no cargan
- ✅ Las imágenes grandes están en Firebase Storage (externas)
- ✅ Solo el logo está local (`logotcl.png`)

---

## 📋 Checklist Final

Antes de desplegar, verifica:

- [ ] Archivo `.nojekyll` está en `/dist`
- [ ] Archivo `index.html` está en `/dist`
- [ ] Carpeta `_next/` está completa
- [ ] Si usas dominio personalizado, edita `CNAME`
- [ ] Todo el contenido de `/dist` está en el repo
- [ ] GitHub Pages está activado en Settings

---

## 🎉 ¡Todo Listo!

Tu sitio estático de The Child Lens está **100% preparado** para GitHub Pages.

**No necesitas**:
- ❌ Node.js en producción
- ❌ Servidor backend
- ❌ Compilar nada más
- ❌ Configuración adicional

**Solo necesitas**:
- ✅ Subir `/dist` a GitHub
- ✅ Activar GitHub Pages
- ✅ ¡Disfrutar!

---

**Documentación completa**: Ver `README.md` en la raíz del proyecto
