
import React, { useState } from 'react';
import { supabase, isKeyValid, isStripeKey } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Car, Lock, Mail, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isConfigured } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured || !isKeyValid) {
      setError("La configuración de la base de datos es incorrecta.");
      return;
    }
    
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-blue-600">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Car className="text-white w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Gestor Integral</h2>
            <p className="text-gray-500">Acceso a Concesionaria Familiar</p>
          </div>

          {(!isConfigured || !isKeyValid) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-3 text-red-800 text-sm">
              <div className="flex gap-2">
                <AlertTriangle className="shrink-0" size={20} />
                <p className="font-bold">Error Crítico de Configuración</p>
              </div>
              <div className="space-y-2">
                {isStripeKey ? (
                  <p>Has pegado una clave de <strong>Stripe</strong>. Debes usar la clave <strong>anon public</strong> de Supabase.</p>
                ) : (
                  <p>La clave de API actual no es válida. Debe ser un token largo que empiece con <strong>eyJ...</strong></p>
                )}
                <a 
                  href="https://app.supabase.com/project/hjtesbenenthxmcaaegm/settings/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-700 font-bold hover:underline"
                >
                  Obtener clave correcta aquí <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  disabled={!isConfigured || !isKeyValid}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="admin@concesionaria.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  disabled={!isConfigured || !isKeyValid}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isConfigured || !isKeyValid}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Entrar al Sistema'}
            </button>
          </form>
        </div>
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Solo Personal Autorizado</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
