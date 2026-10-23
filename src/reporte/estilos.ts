export const ESTILOS = `
body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1f2937; background: #f8fafc; max-width: 760px; margin: 0 auto; padding: 24px; line-height: 1.45; }
h1 { font-size: 1.6rem; margin: 0 0 4px; }
h2 { font-size: 1.15rem; margin: 28px 0 8px; }
.periodo { color: #475569; margin: 0 0 8px; }
.filtros { margin: 0; padding-left: 20px; color: #334155; }
.kpis { display: flex; flex-wrap: wrap; gap: 12px; margin: 0; }
.kpi { flex: 1 1 140px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
.kpi dt { color: #475569; font-size: 0.85rem; }
.kpi dd { margin: 4px 0 0; font-size: 1.3rem; font-weight: 600; }
.hallazgos { margin: 0; padding: 0; list-style: none; }
.hallazgo { background: #ffffff; border-left: 4px solid #1d4ed8; padding: 8px 12px; margin-bottom: 8px; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #cbd5e1; }
th.cifra, td.cifra { text-align: right; }
tr[data-dominante="true"] { background: #dbeafe; font-weight: 700; }
.seccion-grafica { margin: 16px 0; }
img { max-width: 100%; height: auto; }
@media print {
  body { background: #fff; color: #111111; max-width: none; padding: 0; }
  .kpi, .hallazgo { background: #fff; }
  .seccion-grafica, .kpis, .hallazgo { break-inside: avoid; }
}
`;
