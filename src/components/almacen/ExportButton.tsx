'use client';

import { Download } from 'lucide-react';

type ExportData = {
  [key: string]: string | number | boolean | null;
}[];

export default function ExportButton({
  data,
  filename = 'export.csv',
  buttonText = 'Exportar CSV',
}: {
  data: ExportData;
  filename?: string;
  buttonText?: string;
}) {
  const handleExport = () => {
    if (data.length === 0) return;

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            return stringValue.includes(',') || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          })
          .join(',')
      ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50"
      style={{
        background: 'var(--bg-surface-alt)',
        borderColor: 'var(--border)',
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={e => {
        if (!e.currentTarget.disabled) {
          e.currentTarget.style.borderColor = 'var(--border-focus)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
      title={data.length === 0 ? 'Sin datos para exportar' : undefined}
    >
      <Download className="w-4 h-4" />
      {buttonText}
    </button>
  );
}
