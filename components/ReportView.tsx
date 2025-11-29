
import React from 'react';
import { Trip, Passenger, Partner } from '../types';
import { Printer, Calendar, Users, DollarSign, PieChart, TrendingUp } from 'lucide-react';

interface ReportViewProps {
  trips: Trip[];
  partners: Partner[];
}

export const ReportView: React.FC<ReportViewProps> = ({ trips, partners }) => {
  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Aggregate calculations
  const totalPax = trips.reduce((acc, trip) => acc + trip.passengers.reduce((s, p) => s + p.paxCount, 0), 0);
  const totalRevenue = trips.reduce((acc, trip) => acc + trip.passengers.reduce((s, p) => s + (p.totalValue || 0), 0), 0);
  const totalReceivable = trips.reduce((acc, trip) => acc + trip.passengers.reduce((s, p) => s + (p.receivableAmount || 0), 0), 0);

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Relatório Diário de Manifesto</h1>
           <p className="text-slate-500 dark:text-slate-400">Visualização de impressão otimizada.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-500/20"
        >
          <Printer size={20} /> Imprimir Relatório
        </button>
      </div>

      <div className="bg-white text-slate-900 shadow-xl print:shadow-none print:w-full min-h-[1100px] relative overflow-hidden" id="print-area">
        {/* Header Strip */}
        <div className="h-4 bg-brand-600 w-full print:bg-brand-600"></div>
        
        <div className="p-8 print:p-6">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6 mb-8">
            <div className="flex items-center gap-4">
                <div className="bg-brand-600 text-white p-3 rounded-lg print:border print:border-slate-300 print:text-black">
                    <TrendingUp size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">TurismoFlow</h1>
                    <p className="text-brand-600 font-bold text-sm tracking-widest uppercase">Relatório Operacional & Financeiro</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg capitalize text-slate-700">{today}</p>
                <div className="flex items-center justify-end gap-2 text-slate-400 text-sm mt-1">
                    <Calendar size={14} />
                    <span>Gerado: {new Date().toLocaleTimeString('pt-BR')}</span>
                </div>
            </div>
            </div>

            {/* Executive Summary Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8 print:grid-cols-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 print:border-slate-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users size={20} /></div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Total Pax</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{totalPax}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 print:border-slate-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Faturamento</span>
                    </div>
                    <p className="text-3xl font-black text-emerald-700">R$ {totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 0})}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 print:border-slate-300">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><PieChart size={20} /></div>
                        <span className="text-xs font-bold text-slate-500 uppercase">A Receber</span>
                    </div>
                    <p className="text-3xl font-black text-orange-600">R$ {totalReceivable.toLocaleString('pt-BR', {minimumFractionDigits: 0})}</p>
                </div>
            </div>

            {/* Trip Sections */}
            <div className="space-y-10">
            {trips.map((trip, tIndex) => {
                const confirmedPax = trip.passengers.filter(p => !p.isOverbooked);
                const overbookedPax = trip.passengers.filter(p => p.isOverbooked);
                const tripReceivable = trip.passengers.reduce((sum, p) => sum + p.receivableAmount, 0);
                
                return (
                <div key={trip.id} className="break-inside-avoid">
                    {/* Trip Header Banner */}
                    <div className="bg-slate-800 text-white p-4 rounded-t-xl flex justify-between items-center print:bg-slate-800 print:text-white -webkit-print-color-adjust: exact;">
                        <div className="flex items-center gap-4">
                            <span className="bg-brand-500 text-white font-bold px-3 py-1 rounded text-sm">#{tIndex + 1}</span>
                            <div>
                                <h3 className="text-xl font-bold">{trip.destination}</h3>
                                <p className="text-slate-300 text-xs uppercase tracking-wide font-medium">
                                    {trip.vehicleType} • {trip.time} • Saída: {trip.origin}
                                </p>
                            </div>
                        </div>
                        <div className="text-right text-sm">
                            <p><span className="text-slate-400">Guia:</span> <span className="font-bold">{trip.guideName || 'N/A'}</span></p>
                            <p><span className="text-slate-400">Motorista:</span> <span className="font-bold">{trip.driverName || 'N/A'}</span></p>
                        </div>
                    </div>
                    
                    {/* Main Table */}
                    <div className="border-x border-b border-slate-200 rounded-b-xl overflow-hidden">
                        <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-left print:bg-slate-100">
                            <th className="p-3 w-12 text-slate-600 font-bold border-r border-slate-200">#</th>
                            <th className="p-3 text-slate-600 font-bold">Passageiro / Contato</th>
                            <th className="p-3 text-slate-600 font-bold text-center">Qtd.</th>
                            <th className="p-3 text-slate-600 font-bold">Local de Embarque</th>
                            <th className="p-3 text-slate-600 font-bold text-right">A Receber</th>
                            <th className="p-3 text-slate-600 font-bold w-32">Check-in</th>
                            </tr>
                        </thead>
                        <tbody>
                            {confirmedPax.map((pax, idx) => (
                            <tr key={pax.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50 print:bg-slate-50'}`}>
                                <td className="p-3 text-slate-500 font-mono text-center border-r border-slate-100">{idx + 1}</td>
                                <td className="p-3">
                                    <p className="font-bold text-slate-800 text-base">{pax.name}</p>
                                    <p className="text-xs text-slate-500">{pax.phone}</p>
                                </td>
                                <td className="p-3 text-center">
                                    <span className="inline-block bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded">
                                        {pax.paxCount}
                                    </span>
                                    {pax.childrenCount > 0 && <div className="text-[10px] text-blue-600 mt-1 font-bold">{pax.childrenCount} CHD</div>}
                                </td>
                                <td className="p-3 text-slate-700 text-xs">
                                    <span className="font-medium block mb-0.5 text-sm">{pax.boardingLocation}</span>
                                    <span className="text-slate-400">{pax.boardingTime}</span>
                                </td>
                                <td className="p-3 text-right">
                                    {pax.receivableAmount > 0 ? (
                                        <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
                                            R$ {pax.receivableAmount.toFixed(2)}
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600 font-bold text-xs uppercase">Pago</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    <div className="w-4 h-4 border-2 border-slate-300 rounded mx-auto"></div>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        {confirmedPax.length > 0 && (
                            <tfoot className="bg-slate-50 border-t border-slate-200">
                                <tr>
                                    <td colSpan={4} className="p-3 text-right font-bold text-slate-600 uppercase text-xs">Total a Arrecadar nesta Viagem:</td>
                                    <td className="p-3 text-right font-black text-slate-800 text-lg">R$ {tripReceivable.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                        </table>

                        {overbookedPax.length > 0 && (
                        <div className="p-4 bg-red-50 border-t border-red-200 print:bg-red-50">
                            <h4 className="font-bold text-red-800 text-xs uppercase mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse print:hidden"></span>
                                Passageiros Transferidos / Excedentes
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {overbookedPax.map(pax => {
                                const partner = partners.find(pt => pt.id === pax.assignedPartnerId);
                                return (
                                <div key={pax.id} className="flex justify-between items-center bg-white border border-red-100 p-2 rounded text-sm">
                                    <div>
                                        <span className="font-bold text-red-700">{pax.name}</span>
                                        <span className="text-xs text-red-500 ml-2">({pax.paxCount} pax)</span>
                                    </div>
                                    <span className="font-bold text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                    {partner ? `→ ${partner.name}` : 'AGUARDANDO'}
                                    </span>
                                </div>
                                );
                            })}
                            </div>
                        </div>
                        )}
                    </div>
                </div>
                );
            })}
            </div>

            {/* Signature Area */}
            <div className="mt-16 pt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-20 text-center print:mt-12 break-inside-avoid">
            <div>
                <div className="border-t border-slate-400 w-2/3 mx-auto mb-2"></div>
                <p className="text-xs font-bold text-slate-500 uppercase">Responsável Agência</p>
            </div>
            <div>
                <div className="border-t border-slate-400 w-2/3 mx-auto mb-2"></div>
                <p className="text-xs font-bold text-slate-500 uppercase">Guia / Motorista</p>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};
