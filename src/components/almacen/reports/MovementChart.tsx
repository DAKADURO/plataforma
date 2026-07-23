'use client';

export default function MovementChart({ movement }: { movement: any }) {
  if (!movement || !movement.byDepartment) {
    return <div style={{ color: 'var(--text-muted)' }}>Sin datos</div>;
  }

  const departments = Object.entries(movement.byDepartment as Record<string, number>)
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  const maxValue = Math.max(...departments.map(d => d[1] as number), 1);

  return (
    <div className="space-y-8">
      {/* Movement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border text-center" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Entradas</p>
          <p className="text-3xl font-bold mt-2" style={{ color: '#10b981' }}>
            +{movement.byType?.ENTRADA || 0}
          </p>
        </div>
        <div className="p-4 rounded-lg border text-center" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Salidas</p>
          <p className="text-3xl font-bold mt-2" style={{ color: '#ef4444' }}>
            -{movement.byType?.SALIDA || 0}
          </p>
        </div>
        <div className="p-4 rounded-lg border text-center" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--accent)' }}>
            {(movement.byType?.ENTRADA || 0) + (movement.byType?.SALIDA || 0)}
          </p>
        </div>
      </div>

      {/* Movements by Department Bar Chart */}
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Movimientos por Departamento
        </h3>
        <div className="space-y-3">
          {departments.map(([dept, count], i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {dept}
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                  {count}
                </span>
              </div>
              <div className="w-full h-8 rounded-lg overflow-hidden" style={{ background: 'var(--bg-surface-alt)' }}>
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${((count as number) / maxValue) * 100}%`,
                    background: 'var(--accent)',
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Items */}
      {movement.topItems && movement.topItems.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Productos más movidos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {movement.topItems.slice(0, 10).map((item: any, i: number) => (
              <div
                key={i}
                className="p-3 rounded-lg border flex items-center justify-between"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {i + 1}. {item.name}
                </span>
                <span
                  className="text-xs font-bold px-2 py-1 rounded"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                >
                  {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
