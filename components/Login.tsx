'use client';

import React from 'react';
import { ArrowRight, Cpu, Loader2 } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { motion } from 'motion/react';

export default function Login() {
  const { login } = useFirebase();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const hasCredentialError = Boolean(error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(43,91,181,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(43,91,181,0.10),_transparent_28%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(43,91,181,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(43,91,181,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]"
        >
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <section className="relative bg-[#2d2d2d] px-8 py-10 md:px-12 md:py-14 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.10),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(43,91,181,0.38),_transparent_34%)]" />

              <div className="relative flex h-full min-h-[280px] items-center justify-center">
                <div className="flex flex-col items-center gap-5 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/8 backdrop-blur-sm">
                    <Cpu size={36} className="text-white" />
                  </div>
                  <h1 className="text-5xl font-black tracking-tight text-white">Aletec</h1>
                </div>
              </div>
            </section>

            <section className="bg-white px-6 py-8 md:px-10 md:py-12">
              <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center">
                <div className="mb-8">
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-primary">Entrar</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Acesse sua conta</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Use seu e-mail e senha para entrar no painel da Aletec.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">E-mail</label>
                    <input
                      type="email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 outline-none transition-all ${
                        hasCredentialError
                          ? 'border-red-300 bg-red-50/70 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100'
                          : 'border-slate-200 bg-slate-50 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10'
                      }`}
                      placeholder="voce@aletec.com.br"
                      aria-invalid={hasCredentialError}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Senha</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-900 outline-none transition-all ${
                        hasCredentialError
                          ? 'border-red-300 bg-red-50/70 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100'
                          : 'border-slate-200 bg-slate-50 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10'
                      }`}
                      placeholder="Digite sua senha"
                      aria-invalid={hasCredentialError}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-4 py-3.5 text-sm font-black text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary-dim active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Entrando...
                      </>
                    ) : (
                      <>
                        Entrar no sistema
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
