
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TripManager } from './components/TripManager';
import { OverbookingManager } from './components/OverbookingManager';
import { ReportView } from './components/ReportView';
import { Settings } from './components/Settings';
import { RouteOptimizer } from './components/RouteOptimizer';
import { Trip, Partner, Passenger, VehicleType, CompanyProfile } from './types';

// Mock Initial Data
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
          boardingCoordinates: { lat: -3.7258, lng: -38.4870 }, // Mock coord
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
          boardingCoordinates: { lat: -3.7250, lng: -38.4950 }, // Mock coord
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
    passengers: [] // Intentionally empty for demo
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

const App: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(INITIAL_COMPANY);

  // Add a new trip
  const addTrip = (trip: Trip) => {
    // Ensure origin uses company default if empty
    if (!trip.origin || trip.origin === 'Agência Sede') {
        trip.origin = companyProfile.address;
    }
    setTrips([...trips, trip]);
  };

  // Add a passenger to a specific trip
  const addPassenger = (tripId: string, pax: Passenger) => {
    setTrips(trips.map(t => {
      if (t.id === tripId) {
        return { ...t, passengers: [...t.passengers, pax] };
      }
      return t;
    }));
  };

  // Add a new partner
  const addPartner = (partner: Partner) => {
    setPartners([...partners, partner]);
  };

  // Update existing partner
  const updatePartner = (updatedPartner: Partner) => {
    setPartners(partners.map(p => p.id === updatedPartner.id ? updatedPartner : p));
  };

  // Reassign a passenger to a partner
  const reassignPax = (tripId: string, paxId: string, partnerId: string) => {
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

  // Update passenger boarding status (Check-in)
  const updatePaxStatus = (tripId: string, paxId: string, status: 'pending' | 'boarded' | 'no_show') => {
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

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard trips={trips} />} />
          <Route 
            path="/trips" 
            element={
              <TripManager 
                trips={trips} 
                onAddTrip={addTrip} 
                onAddPassenger={addPassenger} 
              />
            } 
          />
          <Route 
            path="/overbooking" 
            element={
              <OverbookingManager 
                trips={trips} 
                partners={partners}
                onAddPartner={addPartner}
                onUpdatePartner={updatePartner}
                onReassignPax={reassignPax}
              />
            } 
          />
          <Route 
            path="/reports" 
            element={<ReportView trips={trips} partners={partners} />} 
          />
          <Route 
             path="/settings"
             element={<Settings companyProfile={companyProfile} onUpdateCompany={setCompanyProfile} />}
          />
          <Route 
             path="/routes"
             element={
                <RouteOptimizer 
                    trips={trips} 
                    companyProfile={companyProfile} 
                    onUpdatePaxStatus={updatePaxStatus}
                />
             }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;