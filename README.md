# 🌿 Caminos del Bienestar · General San Martín, Mendoza

Plataforma web de **multi-catálogo interactivo**, **turnero directo (WhatsApp + Email)**, **circuito geográfico con Leaflet.js** y **doble sistema de autogestión** para emprendedoras, profesionales de salud/estética, crecimiento personal, bodegas, alojamientos y productos regionales de **General San Martín, Mendoza**.

---

## 🚀 Despliegue Rápido en PythonAnywhere

### Paso 1: Clonar el repositorio en la consola Bash de PythonAnywhere
Abrí una **Bash Console** en PythonAnywhere y ejecutá:

```bash
git clone https://github.com/fotovitale/caminos-del-bienestar.git caminos_bienestar
cd caminos_bienestar
bash setup_pa.sh
```

*(El script `setup_pa.sh` crea automáticamente el entorno virtual `venv`, instala las dependencias de `requirements.txt`, ejecuta las migraciones SQLite, carga las 6 categorías con **RA Peluquerías (Romina)** y recopila los archivos estáticos).*

---

### Paso 2: Configurar la pestaña **Web** en PythonAnywhere
1. Ingresá a la pestaña **Web** → **Add a new web app** → **Manual configuration** (seleccioná Python 3.10 / 3.11 / 3.12).
2. En **Code**:
   - **Source code:** `/home/TU_USUARIO_PA/caminos_bienestar`
   - **Working directory:** `/home/TU_USUARIO_PA/caminos_bienestar`
3. En **Virtualenv**:
   - `/home/TU_USUARIO_PA/caminos_bienestar/venv`
4. En **WSGI configuration file** (hacé clic en el archivo `/var/www/..._wsgi.py` y reemplazá su contenido por):
   ```python
   import os
   import sys

   path = '/home/TU_USUARIO_PA/caminos_bienestar'
   if path not in sys.path:
       sys.path.append(path)

   os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```
5. En **Static files** (opcional pero recomendado para máximo rendimiento):
   - **URL:** `/static/` → **Directory:** `/home/TU_USUARIO_PA/caminos_bienestar/staticfiles`
6. Presioná el botón verde **Reload** arriba de todo.

---

## 🔑 Accesos del Sistema

- **Catálogo Público y Turnero:** `/`
- **Panel General Oculto:** `/gestion/` *(también accesible haciendo clic en el ícono de la hoja del logo principal)*
  - **Usuario inicial:** `admin`
  - **Contraseña inicial:** `bienestar2026`
- **Portal Exclusivo de Romina (RA Peluquerías):** `/mi-catalogo/ra-peluquerias-romina-2026/`

