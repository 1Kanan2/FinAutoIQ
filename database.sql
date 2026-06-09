-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER NOT NULL,
  precio_soles DECIMAL(12, 2) NOT NULL,
  precio_dolares DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_dni ON clientes(dni);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_vehiculos_marca ON vehiculos(marca);

-- Habilitar Row Level Security (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para permitir acceso a usuarios autenticados
CREATE POLICY "Allow authenticated users to read clientes"
  ON clientes
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert clientes"
  ON clientes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update clientes"
  ON clientes
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete clientes"
  ON clientes
  FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read vehiculos"
  ON vehiculos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert vehiculos"
  ON vehiculos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update vehiculos"
  ON vehiculos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete vehiculos"
  ON vehiculos
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ===================================================
-- TABLAS DE CRÉDITO VEHICULAR
-- ===================================================

-- Tabla principal de operaciones de crédito
CREATE TABLE IF NOT EXISTS operaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  vehiculo_id UUID NOT NULL REFERENCES vehiculos(id),
  moneda TEXT NOT NULL CHECK (moneda IN ('PEN', 'USD')),
  precio_vehiculo DECIMAL(14, 2) NOT NULL,
  cuota_inicial DECIMAL(14, 2) NOT NULL DEFAULT 0,
  monto_financiar DECIMAL(14, 2) NOT NULL,
  tipo_tasa TEXT NOT NULL CHECK (tipo_tasa IN ('efectiva', 'nominal')),
  tasa_interes DECIMAL(10, 6) NOT NULL,
  capitalizacion INTEGER,
  tem DECIMAL(12, 10) NOT NULL DEFAULT 0,
  plazo_meses INTEGER NOT NULL,
  meses_gracia_total INTEGER NOT NULL DEFAULT 0,
  meses_gracia_parcial INTEGER NOT NULL DEFAULT 0,
  es_compra_inteligente BOOLEAN NOT NULL DEFAULT FALSE,
  monto_balon DECIMAL(14, 2),
  cok DECIMAL(10, 6) NOT NULL DEFAULT 0,
  costos_adicionales DECIMAL(14, 2) NOT NULL DEFAULT 0,
  van DECIMAL(14, 4),
  tir DECIMAL(12, 10),
  tcea DECIMAL(12, 10),
  total_intereses DECIMAL(14, 2),
  total_pagado DECIMAL(14, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cuotas del cronograma (vinculada a cada operación)
CREATE TABLE IF NOT EXISTS cuotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operacion_id UUID NOT NULL REFERENCES operaciones(id) ON DELETE CASCADE,
  numero_cuota INTEGER NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  saldo_inicial DECIMAL(14, 4) NOT NULL,
  interes DECIMAL(14, 4) NOT NULL,
  amortizacion DECIMAL(14, 4) NOT NULL,
  cuota DECIMAL(14, 4) NOT NULL,
  saldo_final DECIMAL(14, 4) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('normal', 'gracia_total', 'gracia_parcial'))
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_operaciones_cliente ON operaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_vehiculo ON operaciones(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_created ON operaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cuotas_operacion ON cuotas(operacion_id);

-- Row Level Security
ALTER TABLE operaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read operaciones"
  ON operaciones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert operaciones"
  ON operaciones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update operaciones"
  ON operaciones FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete operaciones"
  ON operaciones FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read cuotas"
  ON cuotas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert cuotas"
  ON cuotas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete cuotas"
  ON cuotas FOR DELETE USING (auth.role() = 'authenticated');
