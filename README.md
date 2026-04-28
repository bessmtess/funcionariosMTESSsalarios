# MTESS · Salarios de Funcionarios 2021-2024

Dashboard web (SPA) con los datos de remuneraciones del Ministerio de Trabajo, Empleo y Seguridad Social del Paraguay para los años 2021-2024.

## 🚀 Demo

**URL:** _(habilitar GitHub Pages — ver instrucciones abajo)_

### 🔐 Acceso
- Usuario: `user`
- Contraseña: `123`

## ✨ Características

- **Login** con autenticación cliente-side
- **Datos embebidos** (CSV pre-cargado en `data.js`) — sin servidor, sin esperas
- **7 vistas** del tablero:
  - 📊 Resumen general con stats cards y gráficos
  - 🏆 Ranking de mejor pagados con búsqueda + exportación CSV
  - 👤 Buscador de funcionarios con detalle individual
  - 🏷️ Distribución por concepto de gasto (sueldo, bonificaciones, viáticos…)
  - 👥 Análisis por estado (permanente / contratado / comisionado)
  - 📈 Evolución temporal mensual y anual
  - 📋 Tabla cruda con filtros y paginación
- **Filtro global por año** (2021, 2022, 2023, 2024 o todos)
- **Charts interactivos** con Chart.js
- **Diseño responsivo** con Bootstrap 5

## 📦 Datos

- 5.496 registros base (persona × concepto × año)
- 69.276 filas de pagos (formato largo)
- 594 funcionarios únicos
- 15 conceptos de gasto

Fuente: PDFs oficiales del MTESS (Resumen Anual de Remuneraciones).

## 🛠️ Estructura

```
.
├── index.html          # SPA principal
├── style.css           # estilos
├── app.js              # lógica del dashboard
├── data.js             # datos embebidos (3 MB)
├── build_data.py       # script para regenerar data.js desde CSV
└── README.md
```

## 🌐 Publicar en GitHub Pages

1. Ir a **Settings → Pages**
2. En "Build and deployment" → Source: **Deploy from a branch**
3. Branch: `main` / `(root)` → **Save**
4. Esperar 1-2 minutos. La URL será `https://<usuario>.github.io/funcionariosMTESSsalarios/`

## 💻 Correr localmente

```bash
# Cualquier servidor estático sirve, por ejemplo:
python3 -m http.server 8000
# luego abrir http://localhost:8000
```

> ⚠️ Nota: por las restricciones CORS del navegador, no abras `index.html` con `file://` directamente — usá un servidor local.

## 🔄 Regenerar data.js

Si actualizás los CSVs:

```bash
python3 build_data.py
```

## 📜 Licencia

Datos públicos del MTESS Paraguay. Código bajo MIT.
