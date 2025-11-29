import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Trip } from '../types';
import { Users, AlertTriangle, CheckCircle, Bus, Calendar, DollarSign, Wallet, PiggyBank, X, Filter, ChevronDown, ChevronRight } from 'lucide-react';

interface DashboardProps {
  trips: Trip[];
}

export const Dashboard: React.FC<DashboardProps> = ({ trips }) => {
  // Date Range State
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter trips by date range
  const filteredTrips = useMemo(() => {
     if (!dateRange.start && !dateRange.end) return trips;
     
     return trips.filter(trip => {
       const tripDate = trip.date;
       if (dateRange.start && !dateRange.end) return tripDate === dateRange.start;
       if (dateRange.start && dateRange.end) return tripDate >= dateRange.start && tripDate <= dateRange.end;
       return true;
     });
  }, [trips, dateRange]);

  // Calculate stats based on filtered trips
  const totalPax = filteredTrips.reduce((acc, trip) => acc + trip.passengers.reduce((sum, p) => sum + p.paxCount, 0), 0);
  const totalCapacity = filteredTrips.reduce((acc, trip) => acc + trip.totalSeats, 0);
  const overbookedPax = filteredTrips.reduce((acc, trip) => acc + trip.passengers.filter(p => p.isOverbooked).reduce((sum, p) => sum + p.paxCount, 0), 0);
  const activeVehicles = filteredTrips.length;
  
  // Financial Stats
  const totalServiceValue = filteredTrips.reduce((acc, trip) => acc + trip.passengers.reduce((sum, p) => sum + (p.totalValue || 0), 0), 0);
  const totalPaidAmount = filteredTrips.reduce((acc, trip) => acc + trip.passengers.reduce((sum, p) => sum + (p.paidAmount || 0), 0), 0);
  const totalReceivableAmount = filteredTrips.reduce((acc, trip) => acc + trip.passengers.reduce((sum, p) => sum + (p.receivableAmount || 0), 0), 0);

  const chartData = filteredTrips.map(trip => {
    const paxCount = trip.passengers.reduce((sum, p) => sum + p.paxCount, 0);
    return {
      name: trip.destination.length > 15 ? trip.destination.substring(0, 15) + '...' : trip.destination,
      fullDate: trip.date.split('-').reverse().slice(0, 2).join('/'), // DD/MM
      occupied: paxCount,
      capacity: trip.totalSeats,
      isFull: paxCount > trip.totalSeats
    };
  });

  const formatDateDisplay = (isoDate: string) => {
      if (!isoDate) return '';
      return isoDate.split('-').reverse().join('/');
  };

  const getFilterLabel = () => {
    if (!dateRange.start && !dateRange.end) return "Todo o Período";
    if (dateRange.start && !dateRange.end) return formatDateDisplay(dateRange.start);
    if (dateRange.start && dateRange.end) return `${formatDateDisplay(dateRange.start)} - ${formatDateDisplay(dateRange.end)}`;
    return "Filtro Personalizado";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Painel Operacional</h1>
           <p className="text-slate-500 dark:text-slate-400 text-sm">
              Visão geral de desempenho e ocupação.
           </p>
        </div>
        
        {/* Dropdown Calendar Range Filter */}
        <div className="relative" ref={datePickerRef}>
           <button 
             onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
             className={`
                flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all shadow-sm
                ${isDatePickerOpen 
                    ? 'bg-brand-50 border-brand-200 text-brand-700 ring-2 ring-brand-100 dark:bg-brand-900/30 dark:border-brand-700 dark:text-brand-300' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'}
             `}
           >
               <Calendar size={18} className={isDatePickerOpen ? "text-brand-500" : "text-slate-400"} />
               <span className="font-medium text-sm">{getFilterLabel()}</span>
               <ChevronDown size={16} className={`transition-transform duration-200 ${isDatePickerOpen ? 'rotate-180' : ''}`} />
           </button>

           {/* Dropdown Content */}
           {isDatePickerOpen && (
               <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-fade-in">
                   <div className="space-y-4">
                       <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data Inicial</label>
                           <input 
                               type="date" 
                               className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                               value={dateRange.start}
                               onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                           />
                       </div>
                       
                       <div className="flex justify-center">
                           <ChevronDown size={16} className="text-slate-300" />
                       </div>

                       <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data Final</label>
                           <input 
                               type="date" 
                               className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                               value={dateRange.end}
                               min={dateRange.start}
                               onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                           />
                       </div>

                       <div className="pt-2 flex gap-2 border-t border-slate-100 dark:border-slate-700">
                           <button 
                               onClick={() => { setDateRange({start: '', end: ''}); setIsDatePickerOpen(false); }}
                               className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                           >
                               Limpar (Tudo)
                           </button>
                           <button 
                               onClick={() => setIsDatePickerOpen(false)}
                               className="flex-1 py-2 text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 rounded-lg"
                           >
                               Aplicar
                           </button>
                       </div>
                   </div>
               </div>
           )}
        </div>
      </div>

      {filteredTrips.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center animate-fade-in">
              <Bus size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Nenhuma viagem encontrada</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Tente selecionar outra data ou limpe o filtro para ver todas.</p>
          </div>
      ) : (
      <>
      {/* Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors hover:shadow-md">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Receita Total Estimada</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {totalServiceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Volume de Vendas</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors hover:shadow-md">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pago (Vendedores)</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {totalPaidAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Caixa Entrado</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-purple-500/30">
              <Wallet size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-l-emerald-500 border-y border-r border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors hover:shadow-md">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 font-bold uppercase">A Receber no Embarque</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                {totalReceivableAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1">Pendente</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
              <PiggyBank size={24} />
            </div>
          </div>
      </div>

      {/* Operational Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Passageiros</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{totalPax}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-xl">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Viagens/Veículos</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{activeVehicles}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Capacidade Total: {totalCapacity}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-xl">
            <Bus size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ocupação Média</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
              {totalCapacity > 0 ? Math.round((totalPax / totalCapacity) * 100) : 0}%
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-xl">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border flex items-center justify-between transition-colors ${overbookedPax > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
          <div>
            <p className={`text-sm font-medium ${overbookedPax > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>Overbooking</p>
            <p className={`text-3xl font-bold mt-1 ${overbookedPax > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-white'}`}>{overbookedPax}</p>
          </div>
          <div className={`p-3 rounded-xl ${overbookedPax > 0 ? 'bg-white dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Ocupação por Destino/Viagem</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc' }}
                />
                <Bar dataKey="occupied" radius={[4, 4, 0, 0]} barSize={40} name="Passageiros">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.occupied > entry.capacity ? '#ef4444' : '#0ea5e9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick List / Attention */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-y-auto transition-colors flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Atenção Necessária</h2>
            <div className="space-y-3 flex-1">
              {filteredTrips.filter(t => t.passengers.some(p => p.isOverbooked)).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8 text-slate-400 dark:text-slate-500">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mb-3">
                      <CheckCircle size={32} className="text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <p className="font-medium text-slate-600 dark:text-slate-300">Tudo Certo!</p>
                  <p className="text-xs mt-1">Nenhum problema de overbooking detectado nas viagens exibidas.</p>
                </div>
              ) : (
                filteredTrips.filter(t => t.passengers.some(p => p.isOverbooked)).map(trip => (
                  <div key={trip.id} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-l-4 border-red-500 dark:border-red-400 flex gap-3 shadow-sm">
                     <div className="mt-1"><AlertTriangle className="text-red-500 dark:text-red-400" size={18} /></div>
                     <div>
                       <p className="text-sm font-bold text-red-900 dark:text-red-200">{trip.destination}</p>
                       <p className="text-xs text-red-700 dark:text-red-400 mb-1">{trip.date.split('-').reverse().join('/')} às {trip.time}</p>
                       <span className="inline-block bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                         {trip.passengers.filter(p => p.isOverbooked).reduce((s, p) => s + p.paxCount, 0)} passageiros excedentes
                       </span>
                     </div>
                  </div>
                ))
              )}
            </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};