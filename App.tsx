
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TripManager } from './components/TripManager';
import { OverbookingManager } from './components/OverbookingManager';
import { ReportView } from './components/ReportView';
import { Settings } from './components/Settings';
import { RouteOptimizer } from './components/RouteOptimizer';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { DatabaseSetup } from './components/DatabaseSetup';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './services/supabase';
import { Trip, Partner, Passenger, VehicleType, CompanyProfile } from './types';
import { Loader } from 'lucide-react';

// Mock Initial Data (For Seeding)
const INITIAL_TRIPS: Trip[] = [
  {
    id: 't1',
    date: new Date().toISOString().split('T')[0],
    time: '07:30',
    vehicleType: VehicleType.BUS,
    vehicleModel: 'Volvo B12R',
    totalSeats: 50,
    origin: 'Agência Sede',
    destination: 'Jericoacoara',
    stops: ['Paraipaba', 'Jijoca'],
    driverName: 'Carlos Silva',
    guideName: 'Ana Maria',
    passengers: [
      { 
          id: 'p1', 
          name: 'Roberto Alvez', 
          phone: '+55 (85) 99999-9999', 
          email: 'rob@test.com', 
          paxCount: 2, 
          totalValue: 500.00,
          paidAmount: 200.00,
          receivableAmount: 300.00,
          childrenCount: 0, 
          boardingLocation: 'Hotel Gran Marquise, Fortaleza',
          boardingCoordinates: { lat: -3.7258, lng: -38.4870 },
          boardingTime: '07:00', 
          isOverbooked: false,
          boardingStatus: 'pending'
      },
      { 
          id: 'p2', 
          name: 'Família Souza', 
          phone: '+55 (85) 88888-8888', 
          email: 'souza@test.com', 
          paxCount: 4, 
          totalValue: 1200.00,
          paidAmount: 1200.00,
          receivableAmount: 0.00,
          childrenCount: 2, 
          childrenAges: '5, 8', 
          boardingLocation: 'Praiano Hotel, Fortaleza',
          boardingCoordinates: { lat: -3.7250, lng: -38.4950 },
          boardingTime: '07:15', 
          isOverbooked: false,
          boardingStatus: 'pending' 
      }
    ]
  },
  {
    id: 't2',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    vehicleType: VehicleType.VAN,
    vehicleModel: 'Mercedes Sprinter',
    totalSeats: 15,
    origin: 'Agência Sede',
    destination: 'Beach Park',
    stops: ['Porto das Dunas'],
    driverName: 'João Santos',
    guideName: 'Pedro',
    passengers: []
  }
];

const INITIAL_PARTNERS: Partner[] = [
  { id: 'pt1', name: 'Ceará Tours', contactPerson: 'Mariana', email: 'contato@cearatours.com', phone: '+55 85 91234-5678', specialty: 'Vans' },
  { id: 'pt2', name: 'Nordeste Vip', contactPerson: 'Paulo', email: 'paulo@nvip.com', phone: '+55 85 98765-4321', specialty: 'Ônibus de Luxo' }
];

const INITIAL_COMPANY: CompanyProfile = {
    name: 'TurismoFlow Agência',
    address: 'Av. Beira Mar, 4000, Fortaleza - CE',
    addressCoordinates: { lat: -3.71839, lng: -38.5434 },
    phone: '+55 (85) 33333-3333',
    email: 'contato@turismoflow.com'
};

const ProtectedRoute = () => {
    const { session, loading } = useAuth();
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader size={40} className="text-brand-600 animate-spin" />
            </div>
        );
    }
    return session ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(INITIAL_COMPANY);
  const [loadingData, setLoadingData] = useState(false);
  const [databaseError, setDatabaseError] = useState(false);

  // Fetch Data from Supabase
  const fetchData = async () => {
      if (!user) return;
      setLoadingData(true);
      setDatabaseError(false);

      // Fetch Trips & Passengers
      const { data: tripsData, error: tripsError } = await supabase.from('trips').select('*');
      
      if (tripsError) {
          console.error("Error fetching trips:", tripsError.message);
          if (tripsError.message.includes('Could not find the table') || tripsError.message.includes('relation "public.trips" does not exist')) {
              setDatabaseError(true);
              setLoadingData(false);
              return;
          }
      }
      
      const { data: paxData, error: paxError } = await supabase.from('passengers').select('*');
      if (paxError) console.error("Error fetching passengers:", paxError.message);

      if (tripsData) {
          const formattedTrips: Trip[] = tripsData.map(t => ({
              ...t,
              // Supabase JS client automatically converts Postgres text[] to JS Array. No JSON.parse needed.
              stops: t.stops || [], 
              passengers: paxData ? paxData.filter(p => p.trip_id === t.id).map(p => ({
                  ...p,
                  paxCount: p.pax_count,
                  totalValue: p.total_value,
                  paidAmount: p.paid_amount,
                  receivableAmount: p.receivable_amount,
                  childrenCount: p.children_count,
                  childrenAges: p.children_ages,
                  boardingLocation: p.boarding_location,
                  boardingCoordinates: p.boarding_coordinates,
                  boardingTime: p.boarding_time,
                  isOverbooked: p.is_overbooked,
                  assignedPartnerId: p.assigned_partner_id,
                  boardingStatus: p.boarding_status
              })) : []
          }));
          setTrips(formattedTrips);
      }

      // Fetch Partners
      const { data: partnersData } = await supabase.from('partners').select('*');
      if (partnersData) {
          const formattedPartners: Partner[] = partnersData.map(p => ({
              ...p,
              contactPerson: p.contact_person
          }));
          setPartners(formattedPartners);
      }

      // Fetch Company Profile
      const { data: profileData } = await supabase.from('company_profiles').select('*').single();
      if (profileData) {
          setCompanyProfile({
              name: profileData.name,
              address: profileData.address,
              addressCoordinates: profileData.address_coordinates,
              phone: profileData.phone,
              email: profileData.email
          });
      }

      setLoadingData(false);
  };

  useEffect(() => {
      fetchData();
  }, [user]);

  // Seed Database with Initial Data
  const seedDatabase = async () => {
      if (!user) return;
      setLoadingData(true);

      // Insert Company
      const { error: profileError } = await supabase.from('company_profiles').upsert({
          user_id: user.id,
          name: INITIAL_COMPANY.name,
          address: INITIAL_COMPANY.address,
          address_coordinates: INITIAL_COMPANY.addressCoordinates,
          phone: INITIAL_COMPANY.phone,
          email: INITIAL_COMPANY.email
      }, { onConflict: 'user_id' });
      if(profileError) console.error("Profile Seed Error", profileError.message);

      // Insert Partners
      for (const p of INITIAL_PARTNERS) {
          await supabase.from('partners').insert({
              user_id: user.id,
              name: p.name,
              contact_person: p.contactPerson,
              email: p.email,
              phone: p.phone,
              specialty: p.specialty
          });
      }

      // Insert Trips & Passengers
      for (const t of INITIAL_TRIPS) {
          const { data: tripData, error: tripError } = await supabase.from('trips').insert({
              user_id: user.id,
              date: t.date,
              time: t.time,
              vehicle_type: t.vehicleType,
              vehicle_model: t.vehicleModel,
              total_seats: t.totalSeats,
              origin: t.origin,
              destination: t.destination,
              stops: t.stops, // Send array directly
              driver_name: t.driverName,
              guide_name: t.guideName
          }).select().single();

          if (tripError) console.error("Error seeding trip:", tripError.message);

          if (tripData && !tripError) {
              const passengersToInsert = t.passengers.map(p => ({
                  user_id: user.id,
                  trip_id: tripData.id,
                  name: p.name,
                  phone: p.phone,
                  email: p.email,
                  pax_count: p.paxCount,
                  total_value: p.totalValue,
                  paid_amount: p.paidAmount,
                  receivable_amount: p.receivableAmount,
                  children_count: p.childrenCount,
                  children_ages: p.childrenAges,
                  boarding_location: p.boardingLocation,
                  boarding_coordinates: p.boardingCoordinates,
                  boarding_time: p.boardingTime,
                  is_overbooked: p.isOverbooked,
                  boarding_status: p.boardingStatus
              }));

              if (passengersToInsert.length > 0) {
                  const { error: paxError } = await supabase.from('passengers').insert(passengersToInsert);
                  if (paxError) console.error("Error seeding pax:", paxError.message);
              }
          }
      }
      
      await fetchData();
  };

  const addTrip = async (trip: Trip) => {
    if (!user) return;
    if (!trip.origin || trip.origin === 'Agência Sede') trip.origin = companyProfile.address;

    const { data, error } = await supabase.from('trips').insert({
        user_id: user.id,
        date: trip.date,
        time: trip.time,
        vehicle_type: trip.vehicleType,
        vehicle_model: trip.vehicleModel,
        total_seats: trip.totalSeats,
        origin: trip.origin,
        destination: trip.destination,
        stops: trip.stops, // Send array directly (Supabase handles conversion to text[])
        driver_name: trip.driverName,
        guide_name: trip.guideName
    }).select().single();

    if (error) {
        console.error("Error adding trip:", error.message);
        if (error.message.includes('Could not find the table') || error.message.includes('relation "public.trips" does not exist')) {
            setDatabaseError(true);
        }
        return;
    }

    if (data) {
        // We set stops to [] if null because the UI expects an array
        setTrips([...trips, { ...trip, id: data.id, passengers: [], stops: data.stops || [] }]);
    }
  };

  const updateTrip = async (updatedTrip: Trip) => {
      const { error } = await supabase.from('trips').update({
          date: updatedTrip.date,
          time: updatedTrip.time,
          vehicle_type: updatedTrip.vehicleType,
          vehicle_model: updatedTrip.vehicleModel,
          total_seats: updatedTrip.totalSeats,
          origin: updatedTrip.origin,
          destination: updatedTrip.destination,
          stops: updatedTrip.stops, // Send array directly
          driver_name: updatedTrip.driverName,
          guide_name: updatedTrip.guideName
      }).eq('id', updatedTrip.id);

      if (error) {
          console.error("Error updating trip", error.message);
          return;
      }
      setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  };

  const deleteTrip = async (tripId: string) => {
      const { error } = await supabase.from('trips').delete().eq('id', tripId);
      if (error) {
          console.error("Error deleting trip", error.message);
          return;
      }
      setTrips(trips.filter(t => t.id !== tripId));
  };

  const addPassenger = async (tripId: string, pax: Passenger) => {
    if (!user) return;
    const { data, error } = await supabase.from('passengers').insert({
        user_id: user.id,
        trip_id: tripId,
        name: pax.name,
        phone: pax.phone,
        email: pax.email,
        pax_count: pax.paxCount,
        total_value: pax.totalValue,
        paid_amount: pax.paidAmount,
        receivable_amount: pax.receivableAmount,
        children_count: pax.childrenCount,
        children_ages: pax.childrenAges,
        boarding_location: pax.boardingLocation,
        boarding_coordinates: pax.boardingCoordinates,
        boarding_time: pax.boardingTime,
        notes: pax.notes,
        is_overbooked: pax.isOverbooked
    }).select().single();

    if (error) {
        console.error("Error adding pax:", error.message);
        return;
    }

    if (data) {
        setTrips(trips.map(t => {
            if (t.id === tripId) {
                return { ...t, passengers: [...t.passengers, { ...pax, id: data.id }] };
            }
            return t;
        }));
    }
  };

  const addPartner = async (partner: Partner) => {
    if (!user) return;
    const { data, error } = await supabase.from('partners').insert({
        user_id: user.id,
        name: partner.name,
        contact_person: partner.contactPerson,
        email: partner.email,
        phone: partner.phone,
        specialty: partner.specialty
    }).select().single();

    if (error) {
        console.error("Error adding partner:", error.message);
        return;
    }

    if (data) {
        setPartners([...partners, { ...partner, id: data.id }]);
    }
  };

  const updatePartner = async (updatedPartner: Partner) => {
      const { error } = await supabase.from('partners').update({
          name: updatedPartner.name,
          contact_person: updatedPartner.contactPerson,
          email: updatedPartner.email,
          phone: updatedPartner.phone,
          specialty: updatedPartner.specialty
      }).eq('id', updatedPartner.id);

      if (error) {
          console.error("Error updating partner:", error.message);
          return;
      }

      setPartners(partners.map(p => p.id === updatedPartner.id ? updatedPartner : p));
  };

  const reassignPax = async (tripId: string, paxId: string, partnerId: string) => {
    const { error } = await supabase.from('passengers').update({
        assigned_partner_id: partnerId
    }).eq('id', paxId);

    if (error) {
        console.error("Error reassigning pax:", error.message);
        return;
    }

    setTrips(trips.map(t => {
        if (t.id === tripId) {
            return {
            ...t,
            passengers: t.passengers.map(p => {
                if (p.id === paxId) {
                return { ...p, assignedPartnerId: partnerId };
                }
                return p;
            })
            };
        }
        return t;
    }));
  };

  const updatePaxStatus = async (tripId: string, paxId: string, status: 'pending' | 'boarded' | 'no_show') => {
      const { error } = await supabase.from('passengers').update({
          boarding_status: status
      }).eq('id', paxId);

      if (error) {
          console.error("Error updating status:", error.message);
          return;
      }

      setTrips(trips.map(t => {
          if (t.id === tripId) {
              return {
                  ...t,
                  passengers: t.passengers.map(p => {
                      if (p.id === paxId) {
                          return { ...p, boardingStatus: status };
                      }
                      return p;
                  })
              };
          }
          return t;
      }));
  };

  const updateCompanyProfile = async (profile: CompanyProfile) => {
      if (!user) return;
      const { error } = await supabase.from('company_profiles').upsert({
          user_id: user.id,
          name: profile.name,
          address: profile.address,
          address_coordinates: profile.addressCoordinates,
          phone: profile.phone,
          email: profile.email
      }, { onConflict: 'user_id' });

      if (error) {
          console.error("Error updating profile:", error.message);
          return;
      }

      setCompanyProfile(profile);
  };

  if (databaseError) {
      return (
        <DatabaseSetup />
      );
  }

  return (
    <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route element={<ProtectedRoute />}>
            <Route path="/" element={
                <Layout>
                    <Dashboard trips={trips} />
                </Layout>
            } />
            <Route path="/trips" element={
                <Layout>
                    <TripManager 
                        trips={trips} 
                        onAddTrip={addTrip} 
                        onUpdateTrip={updateTrip}
                        onDeleteTrip={deleteTrip}
                        onAddPassenger={addPassenger} 
                    />
                </Layout>
            } />
            <Route path="/overbooking" element={
                <Layout>
                    <OverbookingManager 
                        trips={trips} 
                        partners={partners}
                        onAddPartner={addPartner}
                        onUpdatePartner={updatePartner}
                        onReassignPax={reassignPax}
                    />
                </Layout>
            } />
            <Route path="/reports" element={
                <Layout>
                    <ReportView trips={trips} partners={partners} />
                </Layout>
            } />
            <Route path="/settings" element={
                <Layout>
                    <Settings 
                        companyProfile={companyProfile} 
                        onUpdateCompany={updateCompanyProfile}
                        onSeedData={seedDatabase} 
                    />
                </Layout>
            } />
            <Route path="/routes" element={
                <Layout>
                    <RouteOptimizer 
                        trips={trips} 
                        companyProfile={companyProfile} 
                        onUpdatePaxStatus={updatePaxStatus}
                    />
                </Layout>
            } />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <HashRouter>
                <AppContent />
            </HashRouter>
        </AuthProvider>
    );
};

export default App;
