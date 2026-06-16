'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowRight, UserPlus } from 'lucide-react';
import api from '@/lib/axios';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/25 mb-4"
          >
            <UserPlus className="text-white" size={28} />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Crear Cuenta</h1>
          <p className="text-sm text-slate-400 mt-1">Solicita acceso a SERVIMIL OS</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {success ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Registro Exitoso</h3>
              <p className="text-sm text-slate-400">Redirigiendo al inicio de sesión...</p>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre</label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="Juan"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Apellido</label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="Pérez"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Correo electrónico</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="juan@servimil.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="+57 300 000 0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all pr-10"
                      placeholder="Min. 8 caracteres"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar Contraseña</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Repite la contraseña"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Crear Cuenta
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Iniciar sesión
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600">
            Powered by <span className="text-slate-400">Centro Digital de Diseño</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
