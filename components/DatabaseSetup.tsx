
import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';

export const DatabaseSetup: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlCode = `
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Trips Table
create table if not exists trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  time text not null,
  vehicle_type text not null,
  vehicle_model text,
  total_seats int not null,
  origin text,
  destination text not null,
  stops text[],
  driver_name text,
  guide_name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Passengers Table
create table if not exists passengers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  trip_id uuid references trips(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  pax_count int default 1,
  total_value numeric,
  paid_amount numeric,
  receivable_amount numeric,
  children_count int default 0,
  children_ages text,
  boarding_location text,
  boarding_coordinates jsonb,
  boarding_time text,
  notes text,
  is_overbooked boolean default false,
  assigned_partner_id text,
  boarding_status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Create Partners Table
create table if not exists partners (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  contact_person text,
  email text,
  phone text,
  specialty text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Create Company Profile Table
create table if not exists company_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  name text,
  address text,
  address_coordinates jsonb,
  phone text,
  email text
);

-- 5. Enable Row Level Security (RLS)
alter table trips enable row level security;
alter table passengers enable row level security;
alter table partners enable row level security;
alter table company_profiles enable row level security;

-- 6. Create Security Policies
-- Trips
create policy "Users can all trips" on trips for all using (auth.uid() = user_id);

-- Passengers
create policy "Users can all passengers" on passengers for all using (auth.uid() = user_id);

-- Partners
create policy "Users can all partners" on partners for all using (auth.uid() = user_id);

-- Company Profiles
create policy "Users can all profiles" on company_profiles for all using (auth.uid() = user_id);
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-brand-600 p-6 flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl text-white">
            <Database size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuração do Banco de Dados</h1>
            <p className="text-brand-100">As tabelas necessárias não foram encontradas no Supabase.</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg">
            <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-bold mb-1">Ação Necessária</p>
              <p>O aplicativo não conseguiu encontrar as tabelas <strong>trips</strong> ou <strong>passengers</strong>. Isso é normal na primeira execução.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">1</span>
              Copie o código SQL abaixo
            </h3>
            
            <div className="relative group">
              <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-64 custom-scrollbar border border-slate-700">
                {sqlCode}
              </pre>
              <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar SQL'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">2</span>
              Execute no Supabase
            </h3>
            <ol className="list-decimal list-inside text-sm text-slate-600 dark:text-slate-400 space-y-2 ml-2">
              <li>Acesse seu projeto no <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline inline-flex items-center gap-1">Dashboard do Supabase <ExternalLink size={12}/></a>.</li>
              <li>Clique no ícone <strong>SQL Editor</strong> na barra lateral esquerda.</li>
              <li>Cole o código copiado e clique em <strong>Run</strong>.</li>
              <li>Volte aqui e recarregue a página.</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
             <button 
               onClick={() => window.location.reload()}
               className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30"
             >
               Já executei, recarregar página
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
