import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skull, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="section-padding py-32 flex items-center justify-center">
        <div className="text-ink-400 text-sm uppercase tracking-widest animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await signIn(email.trim(), password);

    if (signInError) {
      setError(signInError);
      setSubmitting(false);
      return;
    }

    navigate('/admin/dashboard');
  }

  return (
    <div className="animate-fade-in min-h-[calc(100vh-4rem)] flex items-center justify-center section-padding py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-ink-900 border border-ink-700 mb-6">
            <Skull className="w-7 h-7 text-accent-500" strokeWidth={2.5} />
          </div>
          <h1 className="display-text text-4xl text-ink-50 mb-2">Admin</h1>
          <p className="text-ink-400 text-sm">Inicia sesión para gestionar el inventario y los pedidos.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-3 bg-ink-950 border border-red-900/50 px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-ink-300 text-xs uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lazarus.brand"
                className="input-field pl-11"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-ink-300 text-xs uppercase tracking-wider mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-11"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Entrando...' : 'Entrar'}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
