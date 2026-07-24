import { TrendingDown } from 'lucide-react';
import Link from 'next/link';

type LowMarginProject = {
  id: string;
  name: string;
  contractAmount: number;
  totalCost: number;
  margin: number;
};

export default function MarginPanel({
  summary,
}: {
  summary: { avgMargin: number | null; lowMargin: LowMarginProject[]; total: number } | null;
}) {
  if (!summary || summary.total === 0) return null;

  const avg = summary.avgMargin ?? 0;
  const avgColor = avg < 5 ? 'var(--danger)' : avg < 20 ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="rounded-2xl border p-6 md:p-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <h2 className="text-xl font-bold flex items-center gap-3 mb-6" style={{ color: 'var(--text-primary)' }}>
        <TrendingDown className="w-6 h-6" style={{ color: 'var(--accent)' }} />
        Margen de Rentabilidad
      </h2>

      <div className="p-4 rounded-xl border mb-6" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
        <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
          Margen Bruto Promedio ({summary.total} {summary.total === 1 ? 'proyecto contratado' : 'proyectos contratados'})
        </span>
        <div className="text-3xl font-black" style={{ color: avgColor }}>{avg.toFixed(1)}%</div>
      </div>

      {summary.lowMargin.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Ningún proyecto tiene margen por debajo del 20%.</p>
      ) : (
        <>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Proyectos con margen bajo (&lt;20%)
          </h3>
          <div className="space-y-2">
            {summary.lowMargin.map(p => (
              <Link
                key={p.id}
                href={`/proyectos/${p.id}`}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border transition-colors"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
              >
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Contratado: ${p.contractAmount.toLocaleString()} · Costo real: ${p.totalCost.toLocaleString()}
                  </p>
                </div>
                <span className="text-lg font-black shrink-0" style={{ color: p.margin < 5 ? 'var(--danger)' : 'var(--warning)' }}>
                  {p.margin.toFixed(1)}%
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
