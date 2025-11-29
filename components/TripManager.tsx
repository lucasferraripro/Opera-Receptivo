
import React, { useState, useEffect, useRef } from 'react';
import { Trip, VehicleType, Passenger, Coordinates } from '../types';
import { Plus, User, MapPin, Clock, Truck, Users, Trash2, Edit, AlertTriangle, ChevronDown, ChevronUp, Map, MoreVertical, DollarSign, Search, Loader, FileText, StickyNote } from 'lucide-react';

interface TripManagerProps {
  trips: Trip[];
  onAddTrip: (trip: Trip) => void;
  onAddPassenger: (tripId: string, pax: Passenger) => void;
}

// -- Helpers --
const formatPhoneNumber = (value: string) => {
  if (!value) return "";
  const phoneNumber = value.replace(/[^\d]/g, "");
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 3) return `+55 (${phoneNumber}`;
  if (phoneNumberLength < 4) return `+55 (${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  if (phoneNumberLength < 8) return `+55 (${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}`;
  return `+55 (${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
};

// -- Address Autocomplete Component --
interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coords?: Coordinates) => void;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Close suggestions on click outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val); // Keep updating parent text

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (val.length > 2) {
      setLoading(true);
      timeoutRef.current = setTimeout(async () => {
        try {
          // Using OpenStreetMap Nominatim API (Free, no key required for demo)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5&countrycodes=br`
          );
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error fetching addresses", error);
        } finally {
          setLoading(false);
        }
      }, 500); // 500ms debounce
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (item: any) => {
    // Construct a nice display name
    // Prefer display_name for full context, or construct if too long
    const mainText = item.display_name;

    const coords: Coordinates = {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
    };

    // Extract first part of address for shorter display in input if needed, but keeping full is safer
    // We will just use the full display name or the first 3 parts
    const shortText = mainText.split(',').slice(0, 3).join(',');

    onChange(shortText, coords);
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
       <div className="relative">
          <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
              type="text"
              className="w-full pl-9 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
              value={value}
              onChange={handleInput}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="Busque rua, hotel ou local..."
              autoComplete="off"
          />
          {loading && (
             <div className="absolute right-3 top-2.5">
                <Loader size={16} className="animate-spin text-brand-500" />
             </div>
          )}
       </div>
       
       {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
             {suggestions.map((item, idx) => (
                <button
                   key={idx}
                   type="button"
                   onClick={() => handleSelect(item)}
                   className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700 last:border-0"
                >
                   <span className="font-bold block truncate">{item.name || item.address?.road || item.display_name.split(',')[0]}</span>
                   <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">{item.display_name}</span>
                </button>
             ))}
          </div>
       )}
    </div>
  );
};

const RouteVisualizer: React.FC<{ origin: string; destination: string; time: string; stops?: string[] }> = ({ origin, destination, time, stops }) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-800 h-full flex flex-col">
      <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2 uppercase text-xs tracking-wider">
        <MapPin size={16} /> Mapa da Rota
      </h3>

      <div className="flex-1 flex flex-col relative pl-4 border-l-2 border-dashed border-slate-300 dark:border-slate-600 ml-2 pb-12">
        <div className="relative mb-6">
           <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-brand-500 border-2 border-white dark:border-slate-800 shadow-sm z-10"></div>
           <div>
             <span className="text-xs font-bold text-slate-400 uppercase">Origem • {time}</span>
             <p className="font-bold text-lg text-slate-800 dark:text-white leading-tight mt-1">{origin}</p>
             <p className="text-xs text-slate-500 mt-1">Embarque Inicial</p>
           </div>
        </div>

        {/* Intermediate Stops */}
        {stops && stops.length > 0 && (
          <div className="space-y-6 mb-6">
            {stops.map((stop, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-500 border-2 border-white dark:border-slate-800 z-10"></div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Parada {index + 1}</span>
                  <p className="font-medium text-slate-700 dark:text-slate-200 leading-tight">{stop}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="relative mt-auto">
           <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white dark:border-slate-800 shadow-sm z-10"></div>
           <div>
             <span className="text-xs font-bold text-slate-400 uppercase">Destino</span>
             <p className="font-bold text-lg text-slate-800 dark:text-white leading-tight mt-1">{destination}</p>
             <p className="text-xs text-slate-500 mt-1">Desembarque Final</p>
           </div>
        </div>
      </div>
      
      {/* Decorative Map Graphic Placeholder */}
      <div className="mt-6 h-40 bg-blue-100 dark:bg-slate-800 rounded-lg overflow-hidden relative border border-blue-200 dark:border-slate-700">
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 flex-col gap-2">
            <Map size={32} />
            <span className="text-xs font-medium">Visualização GPS</span>
         </div>
      </div>
    </div>
  );
};

const SeatMap: React.FC<{ trip: Trip; vehicleType: VehicleType }> = ({ trip, vehicleType }) => {
  const [selectedSeat, setSelectedSeat] = useState<{number: number, pax?: Passenger} | null>(null);

  const totalSeats = trip.totalSeats;
  const seatsPerRow = vehicleType === VehicleType.BUS ? 4 : 3;

  // Map passengers to seats sequentially
  // In a real app, you'd store seat assignments. Here we simulate it.
  const seatAssignments: Record<number, Passenger> = {};
  let currentSeat = 1;
  trip.passengers.forEach(pax => {
    for (let i = 0; i < pax.paxCount; i++) {
      if (currentSeat <= totalSeats) {
        seatAssignments[currentSeat] = pax;
        currentSeat++;
      }
    }
  });

  const seats = Array.from({ length: totalSeats }, (_, i) => {
    const seatNum = i + 1;
    const pax = seatAssignments[seatNum];
    const status = pax ? (pax.isOverbooked ? 'overbooked' : 'occupied') : 'available';
    return { id: i, number: seatNum, status, pax };
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
         <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Mapa de Assentos ({vehicleType})</h4>
         <div className="flex gap-3 text-[10px]">
           <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Ocupado</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full"></div> Livre</span>
         </div>
      </div>
      
      <div className="flex-1 p-6 flex gap-6">
        {/* The Seat Grid */}
        <div className="flex-1 flex justify-center overflow-y-auto custom-scrollbar max-h-[500px]">
          <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 inline-block">
             {/* Driver */}
             <div className="flex justify-start mb-8 border-b-2 border-slate-200 dark:border-slate-600 pb-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-500 font-bold">MOT</div>
             </div>

             <div className="grid gap-x-6 gap-y-3" style={{ gridTemplateColumns: `repeat(${vehicleType === VehicleType.BUS ? 2 : 1}, 1fr)` }}>
                {/* We render rows logic here manually for better control of the aisle */}
                {Array.from({ length: Math.ceil(totalSeats / seatsPerRow) }).map((_, rowIndex) => {
                   const rowStart = rowIndex * seatsPerRow + 1;
                   return (
                     <div key={rowIndex} className="flex gap-3">
                        {/* Left Side */}
                        <div className="flex gap-2">
                           {[0, 1].map(offset => {
                             const seatNum = rowStart + offset;
                             if (seatNum > totalSeats) return <div key={offset} className="w-8 h-8" />;
                             const seat = seats[seatNum - 1];
                             return (
                               <button 
                                 key={seatNum}
                                 onClick={() => setSelectedSeat({ number: seatNum, pax: seat.pax })}
                                 className={`
                                   w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all shadow-sm
                                   ${seat.status === 'available' ? 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-400 hover:border-brand-400' : ''}
                                   ${seat.status === 'occupied' ? 'bg-emerald-500 text-white hover:bg-emerald-600 ring-2 ring-transparent hover:ring-emerald-200' : ''}
                                   ${seat.status === 'overbooked' ? 'bg-red-500 text-white' : ''}
                                   ${selectedSeat?.number === seatNum ? 'ring-2 ring-brand-500 scale-110 z-10' : ''}
                                 `}
                               >
                                 {seatNum}
                               </button>
                             );
                           })}
                        </div>
                        
                        {/* Aisle (only for bus) */}
                        {vehicleType === VehicleType.BUS && <div className="w-4 text-center text-[10px] text-slate-300 flex items-center justify-center"></div>}

                        {/* Right Side */}
                        <div className="flex gap-2">
                           {[2, 3].map(offset => {
                             if (vehicleType === VehicleType.VAN && offset > 2) return null; // Van usually 1-2 layout or 1-1-1
                             const seatNum = rowStart + offset;
                             if (seatNum > totalSeats) return null;
                             const seat = seats[seatNum - 1];
                             return (
                               <button 
                                 key={seatNum}
                                 onClick={() => setSelectedSeat({ number: seatNum, pax: seat.pax })}
                                 className={`
                                   w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all shadow-sm
                                   ${seat.status === 'available' ? 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-400 hover:border-brand-400' : ''}
                                   ${seat.status === 'occupied' ? 'bg-emerald-500 text-white hover:bg-emerald-600 ring-2 ring-transparent hover:ring-emerald-200' : ''}
                                   ${seat.status === 'overbooked' ? 'bg-red-500 text-white' : ''}
                                   ${selectedSeat?.number === seatNum ? 'ring-2 ring-brand-500 scale-110 z-10' : ''}
                                 `}
                               >
                                 {seatNum}
                               </button>
                             );
                           })}
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>
        </div>

        {/* Selected Seat Info Panel */}
        <div className="w-48 hidden lg:block border-l border-slate-100 dark:border-slate-700 pl-4 space-y-4">
           {selectedSeat ? (
             <div className="animate-fade-in">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3 text-slate-500 dark:text-slate-400 font-bold text-xl border border-slate-200 dark:border-slate-600">
                  {selectedSeat.number}
                </div>
                {selectedSeat.pax ? (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1 block">Ocupado</span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-2">{selectedSeat.pax.name}</p>
                    <div className="text-xs text-slate-500 space-y-1">
                       <p className="flex items-center gap-1 truncate" title={selectedSeat.pax.phone}><User size={10}/> {selectedSeat.pax.phone}</p>
                       <p className="flex items-center gap-1 truncate" title={selectedSeat.pax.boardingLocation}><MapPin size={10}/> {selectedSeat.pax.boardingLocation}</p>
                       {selectedSeat.pax.childrenCount > 0 && <p className="text-blue-500">+ {selectedSeat.pax.childrenCount} Criança(s)</p>}
                       {selectedSeat.pax.notes && (
                         <p className="flex items-start gap-1 text-orange-500 mt-2 italic bg-orange-50 dark:bg-orange-900/20 p-1 rounded">
                           <StickyNote size={10} className="mt-0.5 shrink-0"/> {selectedSeat.pax.notes}
                         </p>
                       )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Disponível</span>
                    <p className="text-xs text-slate-500">Este assento está livre.</p>
                  </div>
                )}
             </div>
           ) : (
             <div className="text-center text-slate-400 mt-10">
               <div className="w-8 h-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded mx-auto mb-2"></div>
               <p className="text-xs">Selecione um assento para ver detalhes</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export const TripManager: React.FC<TripManagerProps> = ({ trips, onAddTrip, onAddPassenger }) => {
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isPaxModalOpen, setIsPaxModalOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  // New Trip Form State
  const [newTrip, setNewTrip] = useState<Partial<Trip> & { stopsInput?: string }>({
    vehicleType: VehicleType.BUS,
    totalSeats: 50,
    stopsInput: ''
  });

  // New Pax Form State
  // Added "addressNumber" to help refine the API result manually
  const [newPax, setNewPax] = useState<Partial<Passenger> & { addressSearch: string, addressNumber: string }>({
    paxCount: 1,
    childrenCount: 0,
    isOverbooked: false,
    totalValue: 0,
    paidAmount: 0,
    receivableAmount: 0,
    phone: '',
    addressSearch: '',
    addressNumber: '',
    notes: ''
  });

  // Auto-calculate receivable when Total or Paid changes
  useEffect(() => {
    const total = newPax.totalValue || 0;
    const paid = newPax.paidAmount || 0;
    setNewPax(prev => ({ ...prev, receivableAmount: total - paid }));
  }, [newPax.totalValue, newPax.paidAmount]);

  // Phone mask handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setNewPax(prev => ({ ...prev, phone: formatted }));
  };

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stopsArray = newTrip.stopsInput ? newTrip.stopsInput.split(',').map(s => s.trim()).filter(s => s !== '') : [];
    
    const trip: Trip = {
      id: Math.random().toString(36).substr(2, 9),
      passengers: [],
      date: new Date().toISOString().split('T')[0],
      vehicleModel: 'Genérico',
      origin: 'Agência Sede', // Default start point
      destination: '',
      time: '08:00',
      stops: stopsArray,
      ...newTrip
    } as Trip;
    
    onAddTrip(trip);
    setIsTripModalOpen(false);
    // Reset form defaults
    setNewTrip({ vehicleType: VehicleType.BUS, totalSeats: 50, stopsInput: '' });
  };

  const handlePaxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) return;

    const targetTrip = trips.find(t => t.id === selectedTripId);
    if (!targetTrip) return;

    const currentOccupancy = targetTrip.passengers.reduce((sum, p) => sum + p.paxCount, 0);
    const newPaxCount = newPax.paxCount || 1;
    
    // Auto-detect overbooking
    const isOverbooked = (currentOccupancy + newPaxCount) > targetTrip.totalSeats;

    // Combine address search with the manual number
    const finalAddress = newPax.addressSearch + (newPax.addressNumber ? `, ${newPax.addressNumber}` : '');

    const pax: Passenger = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      phone: '',
      email: '',
      boardingLocation: finalAddress || targetTrip.origin,
      boardingTime: targetTrip.time,
      ...newPax,
      isOverbooked
    } as Passenger;

    onAddPassenger(selectedTripId, pax);
    setIsPaxModalOpen(false);
    setNewPax({ paxCount: 1, childrenCount: 0, isOverbooked: false, totalValue: 0, paidAmount: 0, receivableAmount: 0, phone: '', addressSearch: '', addressNumber: '', notes: '' });
  };

  const toggleExpand = (id: string) => {
      setExpandedTripId(expandedTripId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Frota & Viagens</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie veículos, guias e manifestos de passageiros.</p>
        </div>
        <button 
          onClick={() => setIsTripModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-brand-500/30"
        >
          <Plus size={20} />
          Registrar Veículo/Viagem
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {trips.map(trip => {
          const occupancy = trip.passengers.reduce((sum, p) => sum + p.paxCount, 0);
          const isFull = occupancy >= trip.totalSeats;
          const overbookedCount = trip.passengers.filter(p => p.isOverbooked).reduce((sum, p) => sum + p.paxCount, 0);
          const isExpanded = expandedTripId === trip.id;
          const totalTripReceivable = trip.passengers.reduce((sum, p) => sum + (p.receivableAmount || 0), 0);

          return (
            <div key={trip.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
              {/* Trip Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 cursor-pointer" onClick={() => toggleExpand(trip.id)}>
                  <div className={`p-3 rounded-xl ${trip.vehicleType === VehicleType.BUS ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'}`}>
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      {trip.destination} 
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border dark:border-slate-600 px-2 py-0.5 rounded-full">
                        {trip.time}
                      </span>
                    </h3>
                    <div className="text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="flex items-center gap-1"><MapPin size={14}/> {trip.origin}</span>
                      <span className="flex items-center gap-1"><User size={14}/> Guia: {trip.guideName || 'N/A'}</span>
                      {totalTripReceivable > 0 && (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold"><DollarSign size={14}/> A Receber: {totalTripReceivable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isFull ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {occupancy}<span className="text-slate-400 dark:text-slate-600 text-lg">/{trip.totalSeats}</span>
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Assentos Ocupados</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedTripId(trip.id); setIsPaxModalOpen(true); }}
                    className="bg-slate-900 dark:bg-brand-600 text-white p-3 rounded-lg hover:bg-slate-800 dark:hover:bg-brand-700 transition-colors shadow-lg shadow-slate-900/20"
                    title="Adicionar Passageiro"
                  >
                    <Plus size={20} />
                  </button>
                  <button onClick={() => toggleExpand(trip.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {/* Visual Seat Bar (Summary) */}
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 flex">
                 <div 
                   className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`} 
                   style={{ width: `${Math.min(100, (occupancy / trip.totalSeats) * 100)}%` }}
                 />
                 {overbookedCount > 0 && (
                   <div 
                     className="h-full bg-red-700 dark:bg-red-400 stripe-pattern" 
                     style={{ width: '5%' }} 
                     title="Overbooking detectado"
                   />
                 )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-6 bg-white dark:bg-slate-800 animate-fade-in border-t border-slate-100 dark:border-slate-700">
                  
                  {/* DETAIL LAYOUT: Map & Seats */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
                     <div className="xl:col-span-4">
                        <RouteVisualizer 
                          origin={trip.origin} 
                          destination={trip.destination} 
                          time={trip.time} 
                          stops={trip.stops}
                        />
                     </div>
                     <div className="xl:col-span-8">
                        <SeatMap trip={trip} vehicleType={trip.vehicleType} />
                     </div>
                  </div>

                  {/* MANIFESTO TABLE */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                      Manifesto de Passageiros
                      {overbookedCount > 0 && (
                        <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded text-xs normal-case">
                          {overbookedCount} Excedente(s)
                        </span>
                      )}
                    </h4>
                    
                    {trip.passengers.length === 0 ? (
                      <p className="text-slate-400 dark:text-slate-500 text-sm italic">Nenhum passageiro registrado ainda.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 uppercase">
                            <tr>
                              <th className="px-4 py-3">Nome</th>
                              <th className="px-4 py-3">Contato</th>
                              <th className="px-4 py-3">Qtd.</th>
                              <th className="px-4 py-3">Detalhes</th>
                              <th className="px-4 py-3">A Receber</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {trip.passengers.map((pax) => (
                              <tr key={pax.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">
                                    {pax.name}
                                    {pax.notes && (
                                        <div className="text-[10px] text-orange-500 flex items-center gap-1 mt-0.5" title={pax.notes}>
                                            <StickyNote size={10} /> {pax.notes.length > 20 ? pax.notes.substring(0,20)+'...' : pax.notes}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                  <div>{pax.phone}</div>
                                  <div className="text-xs opacity-70">{pax.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300 font-bold">
                                    {pax.paxCount}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                  {pax.childrenCount > 0 && (
                                    <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                                      {pax.childrenCount} Criança(s) ({pax.childrenAges})
                                    </span>
                                  )}
                                  <div className="text-xs mt-1 opacity-70">
                                    {pax.boardingLocation} às {pax.boardingTime}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-medium">
                                  {pax.receivableAmount > 0 ? (
                                    <span className="text-red-600 dark:text-red-400">
                                        R$ {pax.receivableAmount.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">Pago</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {pax.isOverbooked ? (
                                    <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                                      <AlertTriangle size={12} /> Overbooked
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full text-xs font-medium">
                                      Confirmado
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Add Trip */}
      {isTripModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Registrar Nova Viagem</h2>
              <button onClick={() => setIsTripModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Trash2 size={20} className="rotate-45" /></button>
            </div>
            <form onSubmit={handleTripSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Veículo</label>
                  <select 
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                    value={newTrip.vehicleType}
                    onChange={(e) => setNewTrip({...newTrip, vehicleType: e.target.value as VehicleType, totalSeats: e.target.value === VehicleType.BUS ? 50 : 15})}
                  >
                    <option value={VehicleType.BUS}>Ônibus (50 lug.)</option>
                    <option value={VehicleType.VAN}>Van (15 lug.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacidade</label>
                  <input 
                    type="number"
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                    value={newTrip.totalSeats}
                    onChange={(e) => setNewTrip({...newTrip, totalSeats: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data da Viagem</label>
                <input 
                  type="date"
                  required
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                  value={newTrip.date || ''}
                  onChange={(e) => setNewTrip({...newTrip, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destino</label>
                <input 
                  type="text" required
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                  value={newTrip.destination || ''}
                  onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                  placeholder="Ex: Jericoacoara, City Tour"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Origem (Ponto Inicial)</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                    value={newTrip.origin || ''}
                    onChange={(e) => setNewTrip({...newTrip, origin: e.target.value})}
                    placeholder="Ex: Garagem, Sede"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horário</label>
                  <input 
                    type="time"
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                    value={newTrip.time || ''}
                    onChange={(e) => setNewTrip({...newTrip, time: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pontos de Parada (Opcional)</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                    value={newTrip.stopsInput || ''}
                    onChange={(e) => setNewTrip({...newTrip, stopsInput: e.target.value})}
                    placeholder="Separe por vírgulas (Ex: Praia A, Restaurante B)"
                  />
                  <p className="text-xs text-slate-400 mt-1">Isso será exibido no visualizador de rota.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Guia</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                      value={newTrip.guideName || ''}
                      onChange={(e) => setNewTrip({...newTrip, guideName: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Motorista</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                      value={newTrip.driverName || ''}
                      onChange={(e) => setNewTrip({...newTrip, driverName: e.target.value})}
                    />
                 </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700 mt-2">
                <button type="button" onClick={() => setIsTripModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Criar Viagem</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Passenger */}
      {isPaxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-brand-50 dark:bg-brand-900/20">
              <h2 className="text-lg font-bold text-brand-900 dark:text-brand-400">Adicionar Passageiro</h2>
              <p className="text-xs text-brand-600 dark:text-brand-300">Registrando para {trips.find(t => t.id === selectedTripId)?.destination}</p>
            </div>
            <form onSubmit={handlePaxSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                <input 
                  type="text" required
                  className="w-full p-3 bg-slate-100 dark:bg-slate-900 border-transparent rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none placeholder-slate-400"
                  value={newPax.name || ''}
                  onChange={(e) => setNewPax({...newPax, name: e.target.value})}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                  <input 
                    type="tel" required
                    className="w-full p-3 bg-slate-100 dark:bg-slate-900 border-transparent rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                    value={newPax.phone || ''}
                    onChange={handlePhoneChange}
                    placeholder="+55 (00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qtd. Pessoas</label>
                  <input 
                    type="number" min="1" required
                    className="w-full p-3 bg-slate-100 dark:bg-slate-900 border-transparent rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                    value={newPax.paxCount}
                    onChange={(e) => setNewPax({...newPax, paxCount: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              {/* Financial Section */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-1">
                      <DollarSign size={14}/> Dados Financeiros
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Valor Total</label>
                      <input 
                        type="number" min="0" step="0.01"
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                        value={newPax.totalValue || ''}
                        onChange={(e) => setNewPax({...newPax, totalValue: parseFloat(e.target.value)})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Pago (Vendedor)</label>
                      <input 
                        type="number" min="0" step="0.01"
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                        value={newPax.paidAmount || ''}
                        onChange={(e) => setNewPax({...newPax, paidAmount: parseFloat(e.target.value)})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">A Receber</label>
                      <div className="w-full p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg text-sm font-bold text-emerald-700 dark:text-emerald-400">
                         R$ {(newPax.receivableAmount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Crianças</label>
                    <input 
                        type="number" min="0"
                        className="w-full p-3 bg-slate-100 dark:bg-slate-900 border-transparent rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                        value={newPax.childrenCount}
                        onChange={(e) => setNewPax({...newPax, childrenCount: parseInt(e.target.value)})}
                    />
                 </div>
                 {newPax.childrenCount! > 0 && (
                    <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Idade das Crianças</label>
                    <input 
                        type="text"
                        className="w-full p-3 bg-slate-100 dark:bg-slate-900 border-transparent rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none"
                        value={newPax.childrenAges || ''}
                        onChange={(e) => setNewPax({...newPax, childrenAges: e.target.value})}
                        placeholder="Ex: 5, 8, 12"
                    />
                    </div>
                 )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Local de Embarque</label>
                        <AddressAutocomplete 
                           value={newPax.addressSearch || ''}
                           onChange={(val, coords) => setNewPax({...newPax, addressSearch: val, boardingCoordinates: coords})}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Busque pelo nome da rua ou do hotel.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Número / Comp.</label>
                            <input 
                                type="text"
                                placeholder="Ex: 123, Apt 101"
                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                                value={newPax.addressNumber || ''}
                                onChange={(e) => setNewPax({...newPax, addressNumber: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Horário</label>
                            <input 
                                type="time"
                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                                value={newPax.boardingTime || ''}
                                onChange={(e) => setNewPax({...newPax, boardingTime: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas / Observações</label>
                  <textarea 
                    className="w-full p-3 bg-slate-100 dark:bg-slate-900 border-transparent rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition-all outline-none resize-none h-20 text-sm"
                    value={newPax.notes || ''}
                    onChange={(e) => setNewPax({...newPax, notes: e.target.value})}
                    placeholder="Ex: Cliente VIP, necessita de assento na frente, cadeirante..."
                  />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsPaxModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-lg shadow-brand-500/30">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
