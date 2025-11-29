
import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { Building2, Save, MapPin, Phone, Mail, Database, RefreshCw } from 'lucide-react';
import { AddressAutocomplete } from './TripManager';

interface SettingsProps {
  companyProfile: CompanyProfile;
  onUpdateCompany: (profile: CompanyProfile) => void;
  onSeedData?: () => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ companyProfile, onUpdateCompany, onSeedData }) => {
  const [formData, setFormData] = useState<CompanyProfile>(companyProfile);
  const [saved, setSaved] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSeed = async () => {
      if(onSeedData && window.confirm("Isso adicionará dados de exemplo ao seu banco de dados. Deseja continuar?")) {
          setSeeding(true);
          await onSeedData();
          setSeeding(false);
          alert("Dados de exemplo carregados com sucesso!");
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
         <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl text-brand-600 dark:text-brand-400">
            <Building2 size={24} />
         </div>
         <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações da Empresa</h1>
            <p className="text-slate-500 dark:text-slate-400">Gerencie informações da agência e ponto de partida padrão.</p>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
         <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nome da Agência</label>
                <input 
                  type="text" required
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: TurismoFlow Viagens"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <MapPin size={16} /> Endereço Sede (Ponto de Partida Padrão)
                </label>
                <div className="relative">
                    <AddressAutocomplete 
                        value={formData.address}
                        onChange={(val, coords) => setFormData({...formData, address: val, addressCoordinates: coords})}
                    />
                    <p className="text-xs text-slate-500 mt-2">Este endereço será usado como origem para criação de novas rotas se não especificado na viagem.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Phone size={16} /> Telefone de Contato
                    </label>
                    <input 
                    type="tel"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Mail size={16} /> E-mail Institucional
                    </label>
                    <input 
                    type="email"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                {saved ? (
                    <span className="text-emerald-600 font-bold text-sm animate-fade-in flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Alterações salvas com sucesso!
                    </span>
                ) : <span></span>}
                
                <button 
                  type="submit" 
                  className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 flex items-center gap-2"
                >
                    <Save size={20} /> Salvar Configurações
                </button>
            </div>
         </form>
      </div>

      {/* Demo Data Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Database size={20} />
              </div>
              <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Dados de Demonstração</h3>
                  <p className="text-sm text-slate-500">Use esta opção para preencher o banco de dados com veículos e passageiros de teste.</p>
              </div>
          </div>
          <button 
              onClick={handleSeed}
              disabled={seeding}
              className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center justify-center gap-2"
          >
              {seeding ? <RefreshCw className="animate-spin" size={20} /> : <Database size={20} />}
              {seeding ? 'Carregando...' : 'Carregar Dados de Exemplo'}
          </button>
      </div>
    </div>
  );
};
