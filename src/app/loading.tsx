export default function Loading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Cargando datos...</p>
    </div>
  );
}
