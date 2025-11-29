import React, { useState } from 'react';
import { Trip, Passenger, Partner } from '../types';
import { generatePartnerEmail } from '../services/geminiService';
import { AlertTriangle, Mail, Phone, ExternalLink, Sparkles, UserPlus, Check, Edit2 } from 'lucide-react';

interface OverbookingManagerProps {
  trips: Trip[];
  partners: Partner[];
  onAddPartner: (partner: Partner) => void;
  onUpdatePartner: (partner: Partner) => void;
  onReassignPax: (tripId: string, paxId: string, partnerId: string) => void;
}

export const OverbookingManager: React.FC<OverbookingManagerProps> = ({ trips, partners, onAddPartner, onUpdatePartner, onReassignPax }) => {
  const [activeTab, setActiveTab] = useState<'overbooked' | 'partners'>('overbooked');
  const [partnerFormData, setPartnerFormData] = useState<Partial<Partner>>({});
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);

  const [selectedPaxForTransfer, setSelectedPaxForTransfer] = useState<Passenger | null>(null);
  const [selectedTripForTransfer, setSelectedTripForTransfer] = useState<Trip | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter trips that have overbooked passengers
  const problemTrips = trips.filter(t => t.passengers.some(p => p.isOverbooked && !p.assignedPartnerId));

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPartnerId) {
        // Update existing
        onUpdatePartner({
            ...partnerFormData,
            id: editingPartnerId
        } as Partner);
    } else {
        // Create new
        onAddPartner({
          id: Math.random().toString(36).substr(2, 9),
          name: '',
          contactPerson: '',
          email: '',
          phone: '',
          ...partnerFormData
        } as Partner);
    }
    
    setPartnerFormData({});
    setEditingPartnerId(null);
    setIsPartnerModalOpen(false);
  };

  const openEditModal = (partner: Partner) => {
      setPartnerFormData(partner);
      setEditingPartnerId(partner.id);
      setIsPartnerModalOpen(true);
  };

  const openNewModal = () => {
      setPartnerFormData({});
      setEditingPartnerId(null);
      setIsPartnerModalOpen(true);
  }

  const handleGenerateEmail = async (partner: Partner) => {
    if (!selectedPaxForTransfer || !selectedTripForTransfer) return;
    
    setIsGenerating(true);
    const draft = await generatePartnerEmail(
      partner.name,
      selectedPaxForTransfer.paxCount,
      `${selectedTripForTransfer.destination} às ${selectedTripForTransfer.time}`,
      [selectedPaxForTransfer.name]
    );
    setGeneratedEmail(draft);
    setIsGenerating(false);
  };

  const handleAssign = (partnerId: string) => {
     if(selectedPaxForTransfer && selectedTripForTransfer) {
         onReassignPax(selectedTripForTransfer.id, selectedPaxForTransfer.id, partnerId);
         setSelectedPaxForTransfer(null);
         setSelectedTripForTransfer(null);
         setGeneratedEmail('');
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('overbooked')}
          className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'overbooked' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          Passageiros em Overbooking
        </button>
        <button 
          onClick={() => setActiveTab('partners')}
          className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'partners' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          Rede de Parceiros
        </button>
      </div>

      {activeTab === 'overbooked' && (
        <div className="space-y-6 animate-fade-in">
           {problemTrips.length === 0 ? (
             <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center transition-colors">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
                 <Check size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-800 dark:text-white">Nenhum Overbooking Pendente</h3>
               <p className="text-slate-500 dark:text-slate-400 mt-2">Todos os passageiros estão atribuídos a veículos ou parceiros.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="space-y-4">
                 {problemTrips.map(trip => (
                   <div key={trip.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                       <AlertTriangle className="text-red-500 dark:text-red-400" size={20}/>
                       {trip.destination}
                     </h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{trip.time} - {trip.origin}</p>
                     
                     <div className="space-y-3">
                       {trip.passengers.filter(p => p.isOverbooked && !p.assignedPartnerId).map(pax => (
                         <div key={pax.id} className={`p-4 rounded-xl border transition-all ${selectedPaxForTransfer?.id === pax.id ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 ring-2 ring-brand-500' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40'}`}>
                           <div className="flex justify-between items-start">
                             <div>
                               <p className="font-bold text-slate-900 dark:text-slate-100">{pax.name}</p>
                               <p className="text-sm text-slate-600 dark:text-slate-400">{pax.paxCount} Pessoa(s) • {pax.phone}</p>
                             </div>
                             <button 
                               onClick={() => { setSelectedPaxForTransfer(pax); setSelectedTripForTransfer(trip); setGeneratedEmail(''); }}
                               className="px-3 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm"
                             >
                               Buscar Parceiro
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>

               {/* Right Side: Action Panel */}
               <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit sticky top-6 transition-colors">
                 {selectedPaxForTransfer ? (
                   <div>
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Reatribuir: {selectedPaxForTransfer.name}</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Selecione um parceiro para transferir estes {selectedPaxForTransfer.paxCount} passageiros.</p>
                     
                     <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                       {partners.map(partner => (
                         <div key={partner.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-500 transition-colors">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-bold text-slate-800 dark:text-white">{partner.name}</h4>
                              <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">{partner.specialty || 'Geral'}</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <a 
                                href={`https://wa.me/${partner.phone.replace(/[^0-9]/g, '')}?text=Olá, preciso de ajuda com ${selectedPaxForTransfer.paxCount} passageiros para ${selectedTripForTransfer?.destination}.`} 
                                target="_blank" rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                              >
                                <ExternalLink size={16}/> WhatsApp
                              </a>
                              <button 
                                onClick={() => handleGenerateEmail(partner)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                              >
                                <Sparkles size={16}/> Criar E-mail
                              </button>
                            </div>

                            {generatedEmail && isGenerating === false && (
                              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                                <p className="font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{generatedEmail}</p>
                                <div className="mt-2 flex gap-2">
                                  <a href={`mailto:${partner.email}?subject=Solicitação de Transferência&body=${encodeURIComponent(generatedEmail)}`} className="w-full text-center bg-slate-800 dark:bg-brand-600 text-white py-2 rounded hover:bg-slate-900 dark:hover:bg-brand-700">
                                    Enviar E-mail
                                  </a>
                                </div>
                              </div>
                            )}

                            <button 
                              onClick={() => handleAssign(partner.id)}
                              className="w-full mt-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
                              Confirmar Transferência para {partner.name}
                            </button>
                         </div>
                       ))}
                       {partners.length === 0 && <p className="text-center text-slate-400 dark:text-slate-500">Nenhum parceiro registrado.</p>}
                     </div>
                   </div>
                 ) : (
                   <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                     <UserPlus size={48} className="mx-auto mb-4 opacity-50"/>
                     <p>Selecione um passageiro em overbooking para gerenciar a transferência.</p>
                   </div>
                 )}
               </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'partners' && (
        <div className="animate-fade-in">
           <div className="flex justify-end mb-4">
              <button 
                onClick={openNewModal}
                className="bg-slate-900 dark:bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-slate-900/20"
              >
                <UserPlus size={18} /> Novo Parceiro
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map(partner => (
                <div key={partner.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors relative group">
                   <button 
                     onClick={() => openEditModal(partner)}
                     className="absolute top-4 right-4 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                     title="Editar Parceiro"
                   >
                     <Edit2 size={16} />
                   </button>
                   <h3 className="font-bold text-lg text-slate-800 dark:text-white pr-8">{partner.name}</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Contato: {partner.contactPerson}</p>
                   
                   <div className="space-y-2">
                     <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                       <Mail size={16}/> {partner.email}
                     </div>
                     <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                       <Phone size={16}/> {partner.phone}
                     </div>
                   </div>
                   <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Especialidade</span>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{partner.specialty || 'Transporte Geral'}</p>
                   </div>
                </div>
              ))}
           </div>

           {/* Add/Edit Partner Modal */}
           {isPartnerModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
                 <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
                    {editingPartnerId ? 'Editar Parceiro' : 'Registrar Parceiro'}
                 </h2>
                 <form onSubmit={handlePartnerSubmit} className="space-y-4">
                   <input 
                     placeholder="Nome da Empresa" required
                     className="w-full p-3 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                     value={partnerFormData.name || ''}
                     onChange={e => setPartnerFormData({...partnerFormData, name: e.target.value})}
                   />
                   <input 
                     placeholder="Pessoa de Contato" required
                     className="w-full p-3 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                     value={partnerFormData.contactPerson || ''}
                     onChange={e => setPartnerFormData({...partnerFormData, contactPerson: e.target.value})}
                   />
                   <input 
                     placeholder="E-mail" type="email" required
                     className="w-full p-3 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                     value={partnerFormData.email || ''}
                     onChange={e => setPartnerFormData({...partnerFormData, email: e.target.value})}
                   />
                   <input 
                     placeholder="Telefone / WhatsApp" type="tel" required
                     className="w-full p-3 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                     value={partnerFormData.phone || ''}
                     onChange={e => setPartnerFormData({...partnerFormData, phone: e.target.value})}
                   />
                   <input 
                     placeholder="Especialidade (Ex: Vans, Luxo)"
                     className="w-full p-3 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                     value={partnerFormData.specialty || ''}
                     onChange={e => setPartnerFormData({...partnerFormData, specialty: e.target.value})}
                   />
                   <div className="flex justify-end gap-2 pt-4">
                     <button type="button" onClick={() => setIsPartnerModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                     <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold">
                        {editingPartnerId ? 'Salvar Alterações' : 'Salvar Parceiro'}
                     </button>
                   </div>
                 </form>
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};