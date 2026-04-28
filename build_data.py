"""Genera el archivo data.js embebido con el dataset comprimido."""
import pandas as pd
import json
import os

SRC = "/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/pedidosMONICARECALDE/extrae_tablas"
OUT = "/tmp/funcionariosMTESSsalarios/data.js"

print("Cargando datos...")
dp = pd.read_csv(os.path.join(SRC, "datos_pivot.csv"))
dim_p = pd.read_csv(os.path.join(SRC, "dim_persona.csv"), dtype={"cedula_norm": str})
dim_c = pd.read_csv(os.path.join(SRC, "dim_concepto.csv"), dtype={"concepto": str})
print(f"  datos_pivot: {len(dp):,} filas")
print(f"  dim_persona: {len(dim_p):,}")
print(f"  dim_concepto: {len(dim_c):,}")

# Diccionarios compactos
personas = {}
for _, r in dim_p.iterrows():
    personas[r["cedula_norm"]] = r["nombre"]

conceptos = {}
for _, r in dim_c.iterrows():
    conceptos[str(r["concepto"]).split(".")[0]] = r["denominacion_estandar"]

# Mapear estado a 1 carácter
EST_MAP = {"PERMANENTE": "P", "CONTRATADO": "C", "COMISIONADO": "X"}
TIPO_MAP = {"MENSUAL": "M", "AGUINALDO": "A"}

# Filas compactas: [anio, mes, cedula, estado, concepto, tipo, monto, denominacion]
filas = []
for _, r in dp.iterrows():
    cedula = str(r["cedula"]).replace(".", "")
    if not cedula or cedula == "nan":
        continue
    estado = EST_MAP.get(r["estado"], r["estado"][:1] if isinstance(r["estado"], str) else "")
    tipo = TIPO_MAP.get(r["tipo_pago"], "M")
    concepto = str(r["concepto"]).split(".")[0] if pd.notna(r["concepto"]) else ""
    denom = r["denominacion"] if pd.notna(r["denominacion"]) else ""
    mes = int(r["mes_num"]) if pd.notna(r["mes_num"]) else 0
    monto = int(r["monto"]) if pd.notna(r["monto"]) else 0
    filas.append([
        int(r["anio"]),
        mes,
        cedula,
        estado,
        concepto,
        tipo,
        monto,
    ])

print(f"  filas compactadas: {len(filas):,}")

# Pre-aggregar resumen por persona/año (para queries rápidos del dashboard)
print("Pre-agregando por persona/año...")
pp = pd.read_csv(os.path.join(SRC, "por_persona.csv"))
resumen = []
for _, r in pp.iterrows():
    cedula = str(r["cedula"])
    resumen.append({
        "anio": int(r["ano"]),
        "cedula": cedula,
        "nombre": str(r["nombre"]),
        "ene": int(r["enero"]), "feb": int(r["febrero"]), "mar": int(r["marzo"]),
        "abr": int(r["abril"]), "may": int(r["mayo"]), "jun": int(r["junio"]),
        "jul": int(r["julio"]), "ago": int(r["agosto"]), "sep": int(r["setiembre"]),
        "oct": int(r["octubre"]), "nov": int(r["noviembre"]), "dic": int(r["diciembre"]),
        "agu": int(r["aguinaldo"]),
        "tot": int(r["total_anual"]),
    })

# Escribir archivo data.js
with open(OUT, "w", encoding="utf-8") as f:
    f.write("// Datos embebidos - MTESS Funcionarios 2021-2024\n")
    f.write("// Generado automáticamente desde resumen_anual_consolidado.xlsx\n\n")
    f.write("const PERSONAS = ")
    f.write(json.dumps(personas, ensure_ascii=False, separators=(",", ":")))
    f.write(";\n\n")
    f.write("const CONCEPTOS = ")
    f.write(json.dumps(conceptos, ensure_ascii=False, separators=(",", ":")))
    f.write(";\n\n")
    f.write("// Cada fila: [anio, mes, cedula, estado(P/C/X), concepto, tipo(M/A), monto]\n")
    f.write("const PAGOS = ")
    f.write(json.dumps(filas, separators=(",", ":")))
    f.write(";\n\n")
    f.write("// Resumen pre-agregado por persona/año (para velocidad)\n")
    f.write("const RESUMEN = ")
    f.write(json.dumps(resumen, ensure_ascii=False, separators=(",", ":")))
    f.write(";\n\n")
    f.write("const META = {\n")
    f.write(f'  total_pagos: {len(filas)},\n')
    f.write(f'  total_personas: {len(personas)},\n')
    f.write(f'  total_conceptos: {len(conceptos)},\n')
    f.write(f'  anios: [2021, 2022, 2023, 2024],\n')
    f.write(f'  estados: {{"P":"PERMANENTE","C":"CONTRATADO","X":"COMISIONADO"}},\n')
    f.write(f'  tipos: {{"M":"MENSUAL","A":"AGUINALDO"}}\n')
    f.write("};\n")

size_mb = os.path.getsize(OUT) / 1024 / 1024
print(f"\n{OUT} -> {size_mb:.2f} MB")
