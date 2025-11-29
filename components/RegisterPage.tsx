import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Lock, Mail, Loader, User } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20 font-black text-3xl text-white tracking-tighter">
            OR
          </div>
          <h1 className="text-2xl font-bold text-white">Criar Conta</h1>
          <p className="text-slate-400 mt-2 text-sm">Junte-se ao Opera Receptivo</p>
        </div>

        <div className="p-8">
          {success ? (
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <Mail size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Verifique seu E-mail</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Enviamos um link de confirmação para <strong>{email}</strong>. Por favor, confirme para acessar sua conta.
                </p>
                <Link to="/login" className="block w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl mt-4 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Voltar para Login
                </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
                {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center font-medium border border-red-100 dark:border-red-900/50">
                    {error}
                </div>
                )}

                <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                    </div>
                    <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
                    placeholder="seu@email.com"
                    />
                </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                    </div>
                    <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    />
                </div>
                </div>

                <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                >
                {loading ? <Loader size={20} className="animate-spin" /> : 'Criar Conta'}
                </button>
            </form>
          )}

          {!success && (
             <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
                Fazer Login
                </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};