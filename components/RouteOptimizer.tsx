
import React, { useState, useMemo } from 'react';
import { Trip, CompanyProfile, Coordinates, Passenger } from '../types';
import { Map, Navigation, ArrowRight, MapPin, ExternalLink, Printer, Share2, Copy, Check, ListChecks, Phone, MessageCircle, AlertTriangle, UserCheck, XCircle, Users } from 'lucide-react';

interface RouteOptimizerProps {
  trips: Trip[];
  companyProfile: CompanyProfile;
  onUpdatePaxStatus?: (tripId: string, paxId: string, status: 'pending' | 'boarded' | 'no_show') => void;
}

// Haversine Distance Calculation (km)
const calculateDistance = (coord1: Coordinates, coord2: Coordinates) => {
  const R = 6371; // Radius of Earth in km
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLon = (coord2.lng - coord1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) * Math.cos(coord2.lat * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ trips, companyProfile, onUpdatePaxStatus }) => {
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'boarding' | 'route'>('boarding');
  const [copied, setCopied] = useState(false);

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  // Core Logic: Sort passengers by Nearest Neighbor for the route
  const optimizedData = useMemo(() => {
      if (!selectedTrip) return null;

      const originName = selectedTrip.origin && selectedTrip.origin !== 'Agência Sede' 
        ? selectedTrip.origin 
        : companyProfile.address;

      const originCoords = companyProfile.addressCoordinates || { lat: 0, lng: 0 };

      // Passengers who are NOT overbooked (because overbooked go with partners)
      // We map them to a structure we can sort
      let passengersToVisit = selectedTrip.passengers
        .filter(p => !p.isOverbooked && p.assignedPartnerId === undefined)
        .map(p => ({
          ...p,
          hasCoords: !!p.boardingCoordinates
        }));

      const orderedPax: Passenger[] = [];
      let currentCoords = originCoords;

      // Greedy Nearest Neighbor
      while (passengersToVisit.length > 0) {
          let nearestIndex = -1;
          let minDist = Infinity;

          passengersToVisit.forEach((p, idx) => {
              if (!currentCoords || !p.boardingCoordinates) {
                   if (minDist === Infinity) nearestIndex = idx;
                   return;
              }
              const dist = calculateDistance(currentCoords, p.boardingCoordinates);
              if (dist < minDist) {
                  minDist = dist;
                  nearestIndex = idx;
              }
          });

          if (nearestIndex !== -1) {
              const nextPax = passengersToVisit[nearestIndex];
              orderedPax.push(nextPax);
              if (nextPax.boardingCoordinates) currentCoords = nextPax.boardingCoordinates;
              passengersToVisit.splice(nearestIndex, 1);
          } else {
              // Remaining (no coords), just append
              orderedPax.push(...passengersToVisit);
              break;
          }
      }

      // Generate Maps Link
      const baseUrl = 'https://www.google.com/maps/dir/?api=1';
      const originParam = `&origin=${encodeURIComponent(originName)}`;
      
      // We use boarding locations as waypoints
      // Google Maps limits waypoints, so we might need to truncate for very large lists in URL
      // We create a Set of unique addresses to avoid duplicates in the map link
      const uniqueAddresses = new Set<string>();
      const waypoints: string[] = [];
      
      orderedPax.forEach(p => {
          if(!uniqueAddresses.has(p.boardingLocation)) {
              uniqueAddresses.add(p.boardingLocation);
              waypoints.push(p.boardingLocation);
          }
      });

      const destParam = waypoints.length > 0 
        ? `&destination=${encodeURIComponent(waypoints[waypoints.length - 1])}`
        : '';
      
      const waypointsSlice = waypoints.slice(0, waypoints.length - 1);
      const waypointsParam = waypointsSlice.length > 0
        ? `&waypoints=${waypointsSlice.map(w => encodeURIComponent(w)).join('|')}`
        : '';

      return {
          originName,
          orderedPax,
          mapsUrl: `${baseUrl}${originParam}${destParam}${waypointsParam}`
      };
  }, [selectedTrip, companyProfile]);

  const handleCopyLink = () => {
     if(optimizedData) {
        navigator.clipboard.writeText(optimizedData.mapsUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
     }
  };

  const handleStatusChange = (paxId: string, newStatus: 'pending' | 'boarded' | 'no_show') => {
      if (selectedTripId && onUpdatePaxStatus) {
          onUpdatePaxStatus(selectedTripId, paxId, newStatus);
      }
  };

  const getWhatsappLink = (phone: string) => {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      return `https://wa.me/${cleanPhone}`;
  };

  const getPhoneLink = (phone: string) => {
      return `tel:${phone}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl text-brand-600 dark:text-brand-400">
                <Navigation size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Embarques e Rotas</h1>
                <p className="text-slate-500 dark:text-slate-400">Gestão de itinerário e checklist de passageiros.</p>
            </div>
         </div>
         
         <div className="w-full md:w-auto">
             <select 
                className="w-full md:w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white shadow-sm"
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
             >
                <option value="">Selecione uma viagem...</option>
                {trips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                        {trip.date.split('-').reverse().join('/')} - {trip.destination}
                    </option>
                ))}
             </select>
         </div>
      </div>

      {selectedTrip && optimizedData ? (
          <div>
              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 print:hidden">
                  <button 
                    onClick={() => setActiveTab('boarding')}
                    className={`pb-3 px-6 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'boarding' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    <ListChecks size={18} /> Guia de Embarque
                  </button>
                  <button 
                    onClick={() => setActiveTab('route')}
                    className={`pb-3 px-6 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'route' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    <Map size={18} /> Gerador de Rota Inteligente
                  </button>
              </div>

              {/* TAB: BOARDING GUIDE */}
              {activeTab === 'boarding' && (
                  <div className="animate-fade-in space-y-6">
                      
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                             <p className="text-xs text-slate-500 uppercase font-bold">Total Pax</p>
                             <p className="text-2xl font-bold text-slate-800 dark:text-white">{optimizedData.orderedPax.reduce((s, p) => s + p.paxCount, 0)}</p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800">
                             <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold">Embarcados</p>
                             <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                                {optimizedData.orderedPax.filter(p => p.boardingStatus === 'boarded').reduce((s, p) => s + p.paxCount, 0)}
                             </p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                             <p className="text-xs text-slate-500 uppercase font-bold">Pendentes</p>
                             <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {optimizedData.orderedPax.filter(p => !p.boardingStatus || p.boardingStatus === 'pending').reduce((s, p) => s + p.paxCount, 0)}
                             </p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl shadow-sm border border-red-100 dark:border-red-800">
                             <p className="text-xs text-red-600 dark:text-red-400 uppercase font-bold">Ausentes</p>
                             <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                                {optimizedData.orderedPax.filter(p => p.boardingStatus === 'no_show').reduce((s, p) => s + p.paxCount, 0)}
                             </p>
                          </div>
                      </div>

                      {/* Boarding List */}
                      <div className="space-y-4">
                          {optimizedData.orderedPax.map((pax, index) => {
                             const isBoarded = pax.boardingStatus === 'boarded';
                             const isNoShow = pax.boardingStatus === 'no_show';
                             const isPending = !pax.boardingStatus || pax.boardingStatus === 'pending';

                             return (
                               <div 
                                 key={pax.id} 
                                 className={`
                                   relative rounded-xl border-2 transition-all duration-300 p-4 md:p-6
                                   ${isBoarded ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 dark:border-emerald-500' : ''}
                                   ${isNoShow ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 opacity-60' : ''}
                                   ${isPending ? 'bg-white dark:bg-slate-800 border-white dark:border-slate-700 shadow-md hover:border-brand-300 dark:hover:border-brand-500' : ''}
                                 `}
                               >
                                  {isPending && (
                                     <div className="absolute top-0 right-0 p-2">
                                        <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                                            <AlertTriangle size={10} /> Aguardando Embarque
                                        </span>
                                     </div>
                                  )}

                                  <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                      {/* Left Info */}
                                      <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isBoarded ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                                  {index + 1}
                                              </div>
                                              <div>
                                                  <h3 className={`font-bold text-lg ${isBoarded ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>
                                                    {pax.name}
                                                  </h3>
                                                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                      <span className="font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{pax.paxCount} Pax</span>
                                                      <span>•</span>
                                                      <span>{pax.boardingTime}</span>
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          <div className="pl-11">
                                              <p className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-1">
                                                  <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" /> 
                                                  {pax.boardingLocation}
                                              </p>
                                              {pax.notes && (
                                                  <p className="mt-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-100 dark:border-orange-900/40">
                                                      Nota: {pax.notes}
                                                  </p>
                                              )}
                                          </div>
                                      </div>

                                      {/* Actions */}
                                      <div className="flex flex-col gap-3 md:items-end min-w-[200px]">
                                          {/* Main Toggle Button */}
                                          <button 
                                             onClick={() => handleStatusChange(pax.id, isBoarded ? 'pending' : 'boarded')}
                                             className={`
                                               w-full md:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm
                                               ${isBoarded 
                                                 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400' 
                                                 : 'bg-slate-900 text-white hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500'}
                                             `}
                                          >
                                              {isBoarded ? <UserCheck size={20} /> : <Check size={20} />}
                                              {isBoarded ? 'EMBARCADO' : 'CONFIRMAR EMBARQUE'}
                                          </button>

                                          {/* Emergency Actions (Only show if not boarded) */}
                                          {!isBoarded && (
                                              <div className="w-full">
                                                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 md:text-right">Última Chamada de Emergência</p>
                                                  <div className="flex gap-2 justify-end">
                                                      <a 
                                                        href={getWhatsappLink(pax.phone)} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="flex-1 md:flex-none py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-green-500/20"
                                                      >
                                                          <MessageCircle size={16} /> WhatsApp
                                                      </a>
                                                      <a 
                                                        href={getPhoneLink(pax.phone)}
                                                        className="flex-1 md:flex-none py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-blue-500/20"
                                                      >
                                                          <Phone size={16} /> Ligar
                                                      </a>
                                                  </div>
                                                  <div className="mt-2 text-right">
                                                      <button 
                                                        onClick={() => handleStatusChange(pax.id, isNoShow ? 'pending' : 'no_show')}
                                                        className="text-xs text-red-500 hover:text-red-700 underline decoration-red-300"
                                                      >
                                                          {isNoShow ? 'Desmarcar Ausência' : 'Marcar como Ausente (No-Show)'}
                                                      </button>
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                               </div>
                             );
                          })}
                          
                          {optimizedData.orderedPax.length === 0 && (
                              <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300">
                                  <Users size={48} className="mx-auto mb-4 opacity-50"/>
                                  <p>Nenhum passageiro para embarque nesta rota.</p>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* TAB: SMART ROUTE GENERATOR */}
              {activeTab === 'route' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                      {/* Left Column: List */}
                      <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                                Sequência Otimizada (GPS)
                            </h3>
                            
                            <div className="relative pl-6 border-l-2 border-dashed border-slate-300 dark:border-slate-600 space-y-8 ml-2">
                                <div className="relative">
                                    <div className="absolute -left-[31px] top-0 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-brand-600">
                                        <MapPin size={16} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Partida</p>
                                    <p className="font-medium text-slate-800 dark:text-white leading-tight">
                                        {optimizedData.originName}
                                    </p>
                                </div>

                                {optimizedData.orderedPax.map((pax, idx) => {
                                    const isLast = idx === optimizedData.orderedPax.length - 1;
                                    return (
                                        <div key={idx} className="relative">
                                            <div className={`absolute -left-[31px] top-0 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full ${isLast ? 'text-red-500' : 'text-slate-400'}`}>
                                                {isLast ? <MapPin size={16} /> : <ArrowRight size={16} />}
                                            </div>
                                            <p className="text-xs font-bold text-slate-500 uppercase">{idx + 1}. Coleta</p>
                                            <p className="font-medium text-slate-800 dark:text-white leading-tight mt-1">{pax.boardingLocation}</p>
                                            <p className="text-xs text-slate-500 mt-1">{pax.name} ({pax.paxCount}x)</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                      </div>

                      {/* Right Column: Actions & Preview */}
                      <div className="space-y-6">
                        {/* Map Preview */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-64 relative">
                            <iframe 
                                title="Map Preview"
                                width="100%" 
                                height="100%" 
                                style={{ border: 0 }}
                                loading="lazy" 
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://maps.google.com/maps?q=from:${encodeURIComponent(optimizedData.originName)}+to:${optimizedData.orderedPax.length > 0 ? encodeURIComponent(optimizedData.orderedPax[optimizedData.orderedPax.length-1].boardingLocation) : ''}&output=embed`}
                            >
                            </iframe>
                            <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded text-xs text-slate-500">
                                Preview Google Maps
                            </div>
                        </div>

                        <div className="bg-brand-50 dark:bg-brand-900/20 p-6 rounded-2xl border border-brand-100 dark:border-brand-800 flex flex-col items-center text-center">
                            <h3 className="font-bold text-xl text-brand-900 dark:text-white mb-2">Link para Motorista</h3>
                            <p className="text-sm text-brand-700 dark:text-brand-300 mb-6">
                                Compartilhe este link. O Google Maps abrirá já com todas as paradas na ordem correta.
                            </p>
                            
                            <div className="grid grid-cols-1 gap-3 w-full">
                                <a 
                                href={optimizedData.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                                >
                                    <ExternalLink size={18} /> Abrir no Google Maps
                                </a>
                                
                                <button 
                                onClick={handleCopyLink}
                                className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
                                >
                                    {copied ? <Check size={18} className="text-emerald-500"/> : <Copy size={18} />} 
                                    {copied ? 'Link Copiado!' : 'Copiar Link'}
                                </button>
                            </div>
                        </div>
                      </div>
                  </div>
              )}
          </div>
      ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Map size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Selecione uma viagem acima para carregar o guia de embarque.</p>
          </div>
      )}
    </div>
  );
};
