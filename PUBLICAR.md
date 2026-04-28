# Cómo publicar la app en GitHub

La app está lista en esta carpeta. Yo no puedo pushear porque las credenciales git cacheadas en tu Mac son de otro usuario (`diegomezapy`), no de `bessmtess`.

## Pasos para publicar (5 minutos)

### Opción A — desde la terminal (recomendado)

```bash
# 1. Ir a la carpeta de la app
cd "/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/pedidosMONICARECALDE/extrae_tablas/webapp"

# 2. Inicializar repo
git init -b main
git add .
git commit -m "feat: dashboard MTESS funcionarios 2021-2024"

# 3. Conectar con GitHub
git remote add origin https://github.com/bessmtess/funcionariosMTESSsalarios.git

# 4. Pushear (te pedirá usuario bessmtess + Personal Access Token)
git push -u origin main
```

> **Personal Access Token** (PAT): si no tenés, ir a GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate new token (con permiso `repo`). Usar ese token como contraseña en el push.

### Opción B — usando GitHub Desktop

1. Abrir [GitHub Desktop](https://desktop.github.com/) loggeado como `bessmtess`
2. File → Add local repository → seleccionar la carpeta `webapp/`
3. Publish repository → seleccionar el repo `funcionariosMTESSsalarios`

### Opción C — subir por la web

1. Ir a https://github.com/bessmtess/funcionariosMTESSsalarios
2. "uploading an existing file"
3. Arrastrar todos los archivos de la carpeta `webapp/`
4. Commit

## Activar GitHub Pages (publicar el sitio)

Después del push:

1. Ir al repo: https://github.com/bessmtess/funcionariosMTESSsalarios
2. **Settings** (pestaña arriba)
3. **Pages** (menú izquierdo)
4. **Source:** "Deploy from a branch"
5. **Branch:** `main` · `/ (root)` → **Save**
6. Esperar 1-2 min. La URL será:

```
https://bessmtess.github.io/funcionariosMTESSsalarios/
```

## Probar localmente antes de publicar

```bash
cd webapp
python3 -m http.server 8000
# abrir http://localhost:8000
```

Login: `user` / `123`
