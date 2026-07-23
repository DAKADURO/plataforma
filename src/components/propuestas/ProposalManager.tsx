'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  createProposal, updateProposal, deleteProposal,
  addProposalPhoto, deleteProposalPhoto,
  addProposalDocument, deleteProposalDocument,
  addProposalMaterial, deleteProposalMaterial,
  convertToProject,
} from '@/app/actions/proposals';
import {
  Plus, ArrowLeft, Trash2, UploadCloud, X, FolderOpen,
  Image, FileText, Package, Info, ArrowRight, Folders,
  Globe, CheckCircle2, AlertTriangle,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────── */
type Photo = { id: string; url: string; caption: string | null; createdAt: Date };
type ProposalDoc = { id: string; name: string; type: string; url: string; createdAt: Date };
type Material = { id: string; name: string; category: string; quantity: number; unitPrice: number };
type Client = { id: string; name: string };
type Proposal = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  clientId: string;
  client: Client;
  photos: Photo[];
  documents: ProposalDoc[];
  materials: Material[];
  createdAt: Date;
  updatedAt: Date;
};

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  BORRADOR:  { label: 'Borrador',   bg: 'var(--bg-surface-alt)', color: 'var(--text-muted)',  border: 'var(--border)' },
  ENVIADA:   { label: 'Enviada',    bg: 'var(--accent-subtle)',  color: 'var(--accent)',      border: 'var(--accent)' },
  APROBADA:  { label: 'Aprobada',   bg: 'var(--success-bg)',     color: 'var(--success)',     border: 'var(--success)' },
  RECHAZADA: { label: 'Rechazada',  bg: 'var(--danger-bg)',      color: 'var(--danger)',      border: 'var(--danger)' },
  PROYECTO:  { label: 'Proyecto',   bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6',            border: 'rgba(139,92,246,0.4)' },
};

const DOC_TYPES = ['PROPUESTA', 'ORDEN_COMPRA', 'REPORTE', 'PLANO', 'OTRO'];
const DOC_TYPE_LABELS: Record<string, string> = {
  PROPUESTA: 'Propuesta', ORDEN_COMPRA: 'Orden de Compra',
  REPORTE: 'Reporte', PLANO: 'Plano', OTRO: 'Otro',
};
const MAT_CATEGORIES = ['General', 'HVAC', 'Bombas', 'Tubería', 'Eléctrico', 'Estructural', 'Otro'];
const ALL_STATUSES = Object.keys(STATUS_STYLES);

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

/* ─── Component ─────────────────────────────── */
export default function ProposalManager({
  initialProposals,
  clients,
  userRole,
}: {
  initialProposals: Proposal[];
  clients: Client[];
  userRole: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'documents' | 'materials'>('info');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ clientId: '', title: '', description: '', amount: '', status: 'BORRADOR' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Upload states
  const [photoUploading, setPhotoUploading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docType, setDocType] = useState('PROPUESTA');
  const [docName, setDocName] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Material form
  const [matForm, setMatForm] = useState({ name: '', category: 'General', quantity: '1', unitPrice: '0' });
  const [matSubmitting, setMatSubmitting] = useState(false);

  const canEdit = userRole !== 'TECNICO';

  /* ── helpers ── */
  const refresh = () => {
    startTransition(() => router.refresh());
  };

  const syncSelected = (updated: Proposal[]) => {
    setProposals(updated);
    if (selected) {
      const refreshed = updated.find(p => p.id === selected.id);
      if (refreshed) setSelected(refreshed);
    }
  };

  const openCreate = () => {
    setForm({ clientId: clients[0]?.id ?? '', title: '', description: '', amount: '', status: 'BORRADOR' });
    setEditMode(false);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (p: Proposal) => {
    setForm({ clientId: p.clientId, title: p.title, description: p.description ?? '', amount: String(p.amount), status: p.status });
    setEditMode(true);
    setFormError('');
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.clientId) { setFormError('Título y cliente son obligatorios.'); return; }
    setSubmitting(true);
    setFormError('');
    const data = { clientId: form.clientId, title: form.title, description: form.description || undefined, amount: parseFloat(form.amount) || 0, status: form.status };
    let res;
    if (editMode && selected) {
      res = await updateProposal(selected.id, data);
    } else {
      res = await createProposal(data);
    }
    setSubmitting(false);
    if (res.success) { setModalOpen(false); refresh(); }
    else setFormError(res.error ?? 'Error');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta propuesta?')) return;
    await deleteProposal(id);
    if (selected?.id === id) setSelected(null);
    refresh();
  };

  /* ── Photo upload ── */
  const handlePhotoUpload = async (file: File) => {
    if (!selected) return;
    setPhotoUploading(true);
    setUploadError('');
    try {
      const ext = file.name.split('.').pop();
      const filePath = `propuestas/${selected.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('documentos').upload(filePath, file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(filePath);
      const res = await addProposalPhoto(selected.id, publicUrl);
      if (!res.success) throw new Error(res.error);
      refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir foto');
    } finally {
      setPhotoUploading(false);
    }
  };

  /* ── Document upload ── */
  const handleDocUpload = async (file: File) => {
    if (!selected || !docName) { setUploadError('Escribe el nombre del documento primero.'); return; }
    setDocUploading(true);
    setUploadError('');
    try {
      const ext = file.name.split('.').pop();
      const filePath = `propuestas/${selected.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('documentos').upload(filePath, file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(filePath);
      const res = await addProposalDocument(selected.id, docName, docType, publicUrl);
      if (!res.success) throw new Error(res.error);
      setDocName('');
      refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir documento');
    } finally {
      setDocUploading(false);
    }
  };

  /* ── Material add ── */
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !matForm.name) return;
    setMatSubmitting(true);
    await addProposalMaterial(selected.id, {
      name: matForm.name,
      category: matForm.category,
      quantity: parseFloat(matForm.quantity) || 1,
      unitPrice: parseFloat(matForm.unitPrice) || 0,
    });
    setMatForm({ name: '', category: 'General', quantity: '1', unitPrice: '0' });
    setMatSubmitting(false);
    refresh();
  };

  /* ── Convert to project ── */
  const handleConvert = async () => {
    if (!selected) return;
    if (!confirm(`¿Convertir "${selected.title}" en proyecto?`)) return;
    const res = await convertToProject(selected.id);
    if (res.success) {
      setSelected(null);
      router.push('/proyectos');
    }
  };

  /* ── Filtered list ── */
  const filtered = statusFilter === 'Todos' ? proposals : proposals.filter(p => p.status === statusFilter);

  /* ══════════════════════════════
     DETAIL VIEW
     ══════════════════════════════ */
  if (selected) {
    const s = STATUS_STYLES[selected.status] ?? STATUS_STYLES['BORRADOR'];
    const totalMaterials = selected.materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back + header */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>{selected.title}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selected.client.name}</p>
          </div>
          <span
            className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border"
            style={{ background: s.bg, color: s.color, borderColor: s.border }}
          >
            {s.label}
          </span>
          {canEdit && (
            <button
              onClick={() => openEdit(selected)}
              className="px-4 py-2 text-sm font-semibold rounded-xl border transition-colors"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              Editar
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
          {([
            { id: 'info',      label: 'Información', icon: Info },
            { id: 'photos',    label: `Fotos (${selected.photos.length})`, icon: Image },
            { id: 'documents', label: `Documentos (${selected.documents.length})`, icon: FileText },
            { id: 'materials', label: `Materiales (${selected.materials.length})`, icon: Package },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
              style={{
                borderColor: activeTab === id ? 'var(--accent)' : 'transparent',
                color: activeTab === id ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>

          {/* ── Info tab ── */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Cliente',   value: selected.client.name },
                  { label: 'Monto',     value: fmtCurrency(selected.amount) },
                  { label: 'Actualizado', value: new Date(selected.updatedAt).toLocaleDateString('es-MX') },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Descripción</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{selected.description}</p>
                </div>
              )}

              {/* Status change */}
              {canEdit && (
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Cambiar estado</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_STATUSES.filter(s => s !== 'PROYECTO').map(st => {
                      const sty = STATUS_STYLES[st];
                      const active = selected.status === st;
                      return (
                        <button
                          key={st}
                          disabled={active}
                          onClick={async () => {
                            await updateProposal(selected.id, { status: st });
                            refresh();
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border transition-all disabled:opacity-100"
                          style={active
                            ? { background: sty.bg, color: sty.color, borderColor: sty.border }
                            : { background: 'var(--bg-surface-alt)', color: 'var(--text-muted)', borderColor: 'var(--border)' }
                          }
                        >
                          {sty.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Convert to project */}
              {canEdit && selected.status === 'APROBADA' && (
                <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={handleConvert}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl text-white transition-all"
                    style={{ background: 'var(--accent)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
                  >
                    <Folders className="w-4 h-4" />
                    Convertir en Proyecto
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Se creará un nuevo proyecto con el nombre de esta propuesta y se asignará al mismo cliente.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Photos tab ── */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm border"
                  style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />{uploadError}
                </div>
              )}
              {canEdit && (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-alt)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {photoUploading ? (
                    <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--accent)' }}>Subiendo...</p>
                  ) : (
                    <>
                      <UploadCloud className="w-7 h-7 mb-1" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Agregar fotos <span style={{ color: 'var(--text-muted)' }}>JPG, PNG, WEBP</span>
                      </p>
                    </>
                  )}
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files ?? []);
                      files.forEach(f => handlePhotoUpload(f));
                      e.target.value = '';
                    }}
                  />
                </label>
              )}

              {selected.photos.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                  No hay fotos. Sube fotos del sitio de visita.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selected.photos.map(photo => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden border aspect-square"
                      style={{ borderColor: 'var(--border)' }}>
                      <img src={photo.url} alt={photo.caption ?? 'Foto'} className="w-full h-full object-cover" />
                      {canEdit && (
                        <button
                          onClick={async () => {
                            await deleteProposalPhoto(photo.id);
                            refresh();
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'var(--danger)', color: '#fff' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Documents tab ── */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm border"
                  style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />{uploadError}
                </div>
              )}
              {canEdit && (
                <div className="p-4 rounded-xl border space-y-3" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Subir documento</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Nombre</label>
                      <input
                        type="text" placeholder="Ej. Propuesta Técnica" value={docName}
                        onChange={e => setDocName(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Tipo</label>
                      <select value={docType} onChange={e => setDocType(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg outline-none appearance-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      >
                        {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center justify-center gap-2 h-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm font-medium"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    {docUploading ? (
                      <span className="animate-pulse" style={{ color: 'var(--accent)' }}>Subiendo...</span>
                    ) : (
                      <><UploadCloud className="w-4 h-4" /> Seleccionar archivo</>
                    )}
                    <input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) handleDocUpload(e.target.files[0]); e.target.value = ''; }} />
                  </label>
                </div>
              )}

              {selected.documents.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                  No hay documentos. Sube propuestas, órdenes de compra, reportes o planos.
                </p>
              ) : (
                <div className="space-y-2">
                  {DOC_TYPES.map(type => {
                    const docs = selected.documents.filter(d => d.type === type);
                    if (docs.length === 0) return null;
                    return (
                      <div key={type}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                          {DOC_TYPE_LABELS[type]}
                        </p>
                        {docs.map(doc => (
                          <div key={doc.id}
                            className="flex items-center justify-between p-3 rounded-xl border mb-2"
                            style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FolderOpen className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                              <a href={doc.url} target="_blank" rel="noreferrer"
                                className="text-sm font-medium truncate transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                              >
                                {doc.name}
                              </a>
                            </div>
                            {canEdit && (
                              <button onClick={async () => { await deleteProposalDocument(doc.id); refresh(); }}
                                className="p-1.5 rounded-lg transition-colors shrink-0 ml-2"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Materials tab ── */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              {canEdit && (
                <form onSubmit={handleAddMaterial}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border"
                  style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}
                >
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Nombre</label>
                    <input required type="text" placeholder="Ej. Bomba centrífuga 3HP" value={matForm.name}
                      onChange={e => setMatForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Categoría</label>
                    <select value={matForm.category} onChange={e => setMatForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg outline-none appearance-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      {MAT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Cantidad</label>
                    <input type="number" min="0.01" step="0.01" value={matForm.quantity}
                      onChange={e => setMatForm(f => ({ ...f, quantity: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Precio Unit.</label>
                    <input type="number" min="0" step="0.01" value={matForm.unitPrice}
                      onChange={e => setMatForm(f => ({ ...f, unitPrice: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                  </div>
                  <div className="sm:col-span-3" />
                  <div>
                    <label className="text-xs opacity-0 mb-1 block">.</label>
                    <button type="submit" disabled={matSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-white rounded-lg transition-colors disabled:opacity-50"
                      style={{ background: 'var(--accent)' }}
                    >
                      <Plus className="w-4 h-4" />
                      {matSubmitting ? '...' : 'Agregar'}
                    </button>
                  </div>
                </form>
              )}

              {selected.materials.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                  No hay materiales. Agrega los materiales y gastos de la propuesta.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs uppercase tracking-wider"
                          style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                          <th className="px-4 py-3 text-left">Material</th>
                          <th className="px-4 py-3 text-left">Categoría</th>
                          <th className="px-4 py-3 text-right">Cant.</th>
                          <th className="px-4 py-3 text-right">Precio Unit.</th>
                          <th className="px-4 py-3 text-right">Total</th>
                          {canEdit && <th className="px-4 py-3" />}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.materials.map((m, i) => (
                          <tr key={m.id}
                            style={{ borderTop: i === 0 ? 'none' : `1px solid var(--border)` }}
                          >
                            <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</td>
                            <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{m.category}</td>
                            <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{m.quantity}</td>
                            <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{fmtCurrency(m.unitPrice)}</td>
                            <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>{fmtCurrency(m.quantity * m.unitPrice)}</td>
                            {canEdit && (
                              <td className="px-4 py-3 text-center">
                                <button onClick={async () => { await deleteProposalMaterial(m.id); refresh(); }}
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: 'var(--text-muted)' }}
                                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t font-bold" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-alt)' }}>
                          <td colSpan={4} className="px-4 py-3 text-right" style={{ color: 'var(--text-muted)' }}>TOTAL MATERIALES</td>
                          <td className="px-4 py-3 text-right text-base" style={{ color: 'var(--success)' }}>{fmtCurrency(totalMaterials)}</td>
                          {canEdit && <td />}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════
     LIST VIEW
     ══════════════════════════════ */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap gap-2">
          {['Todos', ...ALL_STATUSES].map(f => {
            const sty = f === 'Todos' ? null : STATUS_STYLES[f];
            return (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="px-3 py-1.5 text-xs font-semibold rounded-full transition-all border"
                style={
                  statusFilter === f
                    ? sty
                      ? { background: sty.bg, color: sty.color, borderColor: sty.border }
                      : { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                    : { background: 'var(--bg-surface-alt)', color: 'var(--text-muted)', borderColor: 'var(--border)' }
                }
              >
                {sty ? sty.label : 'Todos'} ({f === 'Todos' ? proposals.length : proposals.filter(p => p.status === f).length})
              </button>
            );
          })}
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
          >
            <Plus className="w-4 h-4" />
            Nueva Propuesta
          </button>
        )}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay propuestas en este estado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(p => {
            const s = STATUS_STYLES[p.status] ?? STATUS_STYLES['BORRADOR'];
            return (
              <div
                key={p.id}
                onClick={() => { setSelected(p); setActiveTab('info'); }}
                className="rounded-2xl p-5 border cursor-pointer transition-all group"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-focus)'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.transform = ''; el.style.boxShadow = ''; }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-base leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{p.title}</h3>
                  <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border"
                    style={{ background: s.bg, color: s.color, borderColor: s.border }}>
                    {s.label}
                  </span>
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{p.client.name}</p>
                <div className="flex items-center justify-between border-t pt-3 mt-3" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{fmtCurrency(p.amount)}</span>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{p.photos.length} fotos</span>
                    <span>{p.documents.length} docs</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl overflow-hidden border shadow-2xl"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {editMode ? 'Editar Propuesta' : 'Nueva Propuesta'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 text-sm rounded-lg border"
                  style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Título *</label>
                <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ej. Sistema HVAC Planta Norte"
                  className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
                  style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Cliente *</label>
                <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl outline-none text-sm appearance-none"
                  style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Monto estimado</label>
                  <input type="number" min="0" step="0.01" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
                    style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Estado</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl outline-none text-sm appearance-none"
                    style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    {ALL_STATUSES.filter(s => s !== 'PROYECTO').map(s => (
                      <option key={s} value={s}>{STATUS_STYLES[s].label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Descripción, alcance o notas de la propuesta..."
                  className="w-full px-3 py-2.5 rounded-xl outline-none text-sm resize-none"
                  style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border transition-colors"
                  style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
                >
                  {submitting ? 'Guardando...' : editMode ? 'Actualizar' : 'Crear Propuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
