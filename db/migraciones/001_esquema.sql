-- ════════════════════════════════════════════════════════════════════════════
-- ValorGanado · Control EVM — esquema (Supabase maestría, esquema public)
-- Nomenclatura: "ValorGanado_<tabla>" (identificadores entre comillas dobles).
-- Idempotente: se puede volver a correr sin perder datos.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- Contenido académico (una fila): textos de fuente/contenido.py y datos del enunciado.
-- Las cifras NO se guardan: la API las recalcula con el motor EVM en cada consulta.
create table if not exists public."ValorGanado_contenido" (
    id              text primary key check (id = 'actividad2'),
    datos           jsonb not null,
    actualizado_en  timestamptz not null default now()
);

-- Simulaciones Monte Carlo del cierre pedidas desde el portal (las ejecuta el worker de Celery)
create table if not exists public."ValorGanado_simulaciones" (
    id             uuid primary key default gen_random_uuid(),
    task_id        text,
    estado         text not null default 'pendiente' check (estado in ('pendiente', 'completada', 'error')),
    parametros     jsonb not null,
    resultado      jsonb,
    error          text,
    duracion_ms    int,
    creado_en      timestamptz not null default now(),
    completado_en  timestamptz
);
create index if not exists "ValorGanado_simulaciones_creado" on public."ValorGanado_simulaciones" (creado_en desc);

-- Catálogo de archivos entregables (lo llena scripts/preparar_entregables.py en cada despliegue)
create table if not exists public."ValorGanado_entregables" (
    ruta      text primary key,
    nombre    text not null,
    tipo      text not null,
    criterio  text not null,
    detalle   text not null default '',
    bytes     bigint not null,
    sha256    text not null check (length(sha256) = 64),
    orden     smallint not null default 0
);

create table if not exists public."ValorGanado_paquetes" (
    id             uuid primary key default gen_random_uuid(),
    task_id        text,
    estado         text not null default 'pendiente' check (estado in ('pendiente', 'completada', 'error')),
    archivo        text,
    n_archivos     int,
    bytes          bigint,
    sha256         text,
    error          text,
    creado_en      timestamptz not null default now(),
    completado_en  timestamptz
);

commit;
