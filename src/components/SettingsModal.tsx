import React, { useState } from 'react';
import type { BusinessSettings } from '../types';
import { X, Save, Download, Upload, RotateCcw, Settings, Database, Cloud, CheckCircle, AlertTriangle } from 'lucide-react';
import { exportDataJSON, importDataJSON, resetToDefaultData } from '../services/storage';
import { isSupabaseConfigured, testConnection } from '../services/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BusinessSettings;
  onSaveSettings: (newSettings: BusinessSettings) => void;
  onDataReload: () => void;
  userId?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onDataReload,
  userId: _userId,
}) => {
  const [name, setName] = useState(settings.name);
  const [subtitle, setSubtitle] = useState(settings.subtitle);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [address, setAddress] = useState(settings.address);
  const [currency, setCurrency] = useState(settings.currency);
  const [instagram, setInstagram] = useState(settings.instagram);
  const [companyCapital, setCompanyCapital] = useState<number>(settings.companyCapital ?? 43580);

  const [testingCloud, setTestingCloud] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<{ success: boolean; text: string } | null>(null);

  const isConfigured = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BusinessSettings = {
      name: name.trim() || 'Aline Beauty',
      subtitle: subtitle.trim() || 'Maquillaje & Accesorios',
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      address: address.trim(),
      currency: currency.trim() || '$',
      instagram: instagram.trim(),
      companyCapital: Number(companyCapital) || 0,
      lastCashCut: settings.lastCashCut,
    };
    onSaveSettings(updated);
    onClose();
  };

  const handleExportBackup = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Respaldo_AlineBeauty_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJSON(content);
        if (success) {
          alert('¡Respaldo importado correctamente!');
          onDataReload();
          onClose();
        } else {
          alert('El archivo de respaldo no es válido.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('¿Estás seguro de restablecer el sistema a los datos iniciales de demostración? Se perderán las ventas actuales.')) {
      resetToDefaultData();
      onDataReload();
      onClose();
    }
  };

  const handleTestConnection = async () => {
    setTestingCloud(true);
    setCloudStatusMsg(null);
    const res = await testConnection();
    setTestingCloud(false);
    setCloudStatusMsg({ success: res.ok, text: res.message });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '600px', padding: '1.8rem', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings size={22} color="var(--primary)" />
            <h3 className="font-serif text-gradient" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              Configuración del Negocio
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Cloud Status Section - info only, sync is automatic */}
          <div style={{
            padding: '1rem',
            borderRadius: '14px',
            backgroundColor: isConfigured ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${isConfigured ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cloud size={18} color={isConfigured ? '#059669' : '#d97706'} />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Base de Datos en la Nube (Supabase)
                </h4>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: isConfigured ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: isConfigured ? '#059669' : '#d97706'
              }}>
                {isConfigured ? '✓ Sincronización Automática Activa' : 'No Configurado (.env)'}
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
              {isConfigured
                ? 'Cada producto, venta o gasto que hagas se guarda automáticamente en la nube y se sincroniza en todos tus dispositivos.'
                : 'Para sincronizar entre tu celular y tu PC, agrega tus credenciales de Supabase en el archivo .env.'}
            </p>

            {cloudStatusMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '0.75rem',
                backgroundColor: cloudStatusMsg.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: cloudStatusMsg.success ? '#059669' : '#dc2626',
                border: `1px solid ${cloudStatusMsg.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {cloudStatusMsg.success ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                <span>{cloudStatusMsg.text}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingCloud}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem' }}
            >
              {testingCloud ? 'Verificando...' : 'Verificar Conexión'}
            </button>
          </div>

          {/* Business Name & Subtitle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Nombre del Negocio
              </label>
              <input
                type="text"
                className="glass-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Eslogan / Subtítulo
              </label>
              <input
                type="text"
                className="glass-input"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
          </div>

          {/* Contacts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Teléfono de Contacto
              </label>
              <input
                type="text"
                className="glass-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Número WhatsApp (con código de país)
              </label>
              <input
                type="text"
                className="glass-input"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="5491123456789"
              />
            </div>
          </div>

          {/* Address & Currency & IG */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Dirección / Ubicación
              </label>
              <input
                type="text"
                className="glass-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                Moneda ($ / USD)
              </label>
              <input
                type="text"
                className="glass-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              Instagram
            </label>
            <input
              type="text"
              className="glass-input"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@alinebeauty.ok"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#c084fc', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>
              Capital al último Corte de Caja
            </label>
            <input
              type="number"
              className="glass-input"
              value={companyCapital}
              onChange={(e) => setCompanyCapital(Number(e.target.value))}
              placeholder="43580"
              style={{ borderColor: 'rgba(168, 85, 247, 0.4)', fontWeight: 700 }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Este saldo se ajusta con los gastos y aportes del ciclo. Al hacer el corte, elegís cuánto del Aumento de Pozo sumar.
            </p>
          </div>

          {/* Data Backup Section */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem', marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Database size={16} /> Respaldo Manual y Restauración
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handleExportBackup} style={{ fontSize: '0.82rem' }}>
                <Download size={16} /> Descargar Copia JSON
              </button>

              <label className="btn btn-secondary" style={{ fontSize: '0.82rem', cursor: 'pointer' }}>
                <Upload size={16} /> Restaurar Desde JSON
                <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ marginTop: '0.8rem' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleResetData}
                style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
              >
                <RotateCcw size={15} /> Restablecer a Datos de Ejemplo
              </button>
            </div>
          </div>

          {/* Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.8rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} /> Guardar Cambios
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
