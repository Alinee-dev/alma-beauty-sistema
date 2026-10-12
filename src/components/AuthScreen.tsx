import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Cloud, 
  Store, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { signInWithEmail, resetPasswordForEmail, isSupabaseConfigured } from '../services/supabase';
import type { BusinessSettings } from '../types';

interface AuthScreenProps {
  settings: BusinessSettings;
  onLoginSuccess: () => void;
  onEnterAsGuestCatalog: () => void;
  onContinueLocalMode: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  settings,
  onLoginSuccess,
  onEnterAsGuestCatalog,
  onContinueLocalMode,
}) => {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const isConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (!isConfigured) {
      setErrorMsg('Supabase aún no está conectado en el archivo .env. Puedes ingresar con el botón "Continuar en Modo Local" mientras configuras tus claves.');
      return;
    }

    setLoading(true);

    try {
      if (isForgotPassword) {
        await resetPasswordForEmail(email);
        setSuccessMsg('¡Enlace de recuperación enviado! Revisa tu bandeja de entrada en ' + email);
      } else {
        await signInWithEmail(email, password);
        onLoginSuccess();
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const message = err instanceof Error ? err.message : 'Error al autenticar';
      if (message.includes('Invalid login credentials')) {
        setErrorMsg('Correo o contraseña incorrectos. Verifica que coincidan con tu usuario creado en Supabase.');
      } else {
        setErrorMsg(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(circle at 10% 10%, rgba(244, 114, 182, 0.2) 0%, transparent 45%), radial-gradient(circle at 90% 90%, rgba(251, 191, 36, 0.15) 0%, transparent 45%), var(--bg-main)'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          boxShadow: '0 20px 45px rgba(236, 72, 153, 0.15)',
          border: '1px solid rgba(244, 114, 182, 0.35)',
          position: 'relative'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(236, 72, 153, 0.4)',
            marginBottom: '1rem',
            border: '2px solid rgba(255, 255, 255, 0.4)'
          }}>
            <Sparkles size={32} color="#ffffff" />
          </div>
          <h1 className="font-serif text-gradient" style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
            {settings.name || 'Aline Beauty'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Acceso Privado para Administradora
          </p>

          {/* Cloud Status Pill */}
          <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: isConfigured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isConfigured ? '#059669' : '#d97706',
              border: `1px solid ${isConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
            }}>
              <Cloud size={13} />
              {isConfigured ? 'Base de Datos en la Nube Lista' : 'Modo Local / Supabase Pendiente'}
            </span>
          </div>
        </div>

        {/* Admin Badge Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          backgroundColor: 'rgba(252, 231, 243, 0.7)',
          padding: '0.6rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--primary)'
        }}>
          <ShieldCheck size={18} />
          <span>Acceso Exclusivo de Aline</span>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#dc2626',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#059669',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {/* Email input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu-correo@ejemplo.com"
                required
                className="glass-input"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={17} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Password input (unless forgot password mode) */}
          {!isForgotPassword && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setErrorMsg(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="glass-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <Lock size={17} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: '0.85rem',
              fontSize: '0.98rem',
              borderRadius: '12px',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 20px rgba(236, 72, 153, 0.4)'
            }}
          >
            {loading ? (
              <span>Iniciando sesión...</span>
            ) : isForgotPassword ? (
              <>
                <span>Enviar enlace de recuperación</span>
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {isForgotPassword && (
            <button
              type="button"
              onClick={() => { setIsForgotPassword(false); setErrorMsg(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', marginTop: '-0.3rem' }}
            >
              ← Volver al inicio de sesión
            </button>
          )}

        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          margin: '1.75rem 0 1.25rem 0',
          color: 'var(--text-dim)',
          fontSize: '0.78rem'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          <span>ACCESO DIRECTO</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          
          {/* Public customer catalog button */}
          <button
            type="button"
            onClick={onEnterAsGuestCatalog}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.7rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem'
            }}
          >
            <Store size={17} />
            <span>Ver Catálogo de Clientes (Modo Público)</span>
          </button>

          {/* Local mode bypass button */}
          <button
            type="button"
            onClick={onContinueLocalMode}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              padding: '0.5rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            Entrar en Modo Local (Temporal sin cuenta)
          </button>
        </div>

        {/* Help guide toggle */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontWeight: 600
            }}
          >
            <HelpCircle size={14} />
            <span>¿Cómo crear tu usuario en Supabase?</span>
          </button>

          {showSetupGuide && (
            <div style={{
              marginTop: '0.8rem',
              padding: '0.85rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(252, 231, 243, 0.7)',
              border: '1px solid var(--border-color)',
              textAlign: 'left',
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              lineHeight: 1.5
            }}>
              <strong>Pasos sencillos:</strong>
              <ol style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li>Entra en tu proyecto de <b>supabase.com</b>.</li>
                <li>En el menú de la izquierda ve a <b>Authentication &gt; Users</b>.</li>
                <li>Haz clic en <b>Add user &gt; Create user</b>.</li>
                <li>Escribe tu correo y la contraseña que quieras usar.</li>
                <li>¡Listo! Con esos mismos datos inicias sesión aquí y en tu celular.</li>
              </ol>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
