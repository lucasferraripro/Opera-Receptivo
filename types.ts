
export enum VehicleType {
  BUS = 'BUS', // 50 seats
  VAN = 'VAN', // 15 seats
  MINIBUS = 'MINIBUS' // Custom
}

export interface Partner {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  specialty?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Passenger {
  id: string;
  name: string;
  phone: string;
  email: string;
  paxCount: number; // Total people in this group
  
  // Financials
  totalValue: number; // Total price of service
  paidAmount: number; // Amount already paid (to seller/agency)
  receivableAmount: number; // Amount to be collected at boarding
  
  childrenCount: number;
  childrenAges?: string; // Comma separated ages
  
  boardingLocation: string; // Address/Point
  boardingCoordinates?: Coordinates; // Lat/Lng for routing
  boardingTime: string;
  
  notes?: string; // Special requests or observations
  
  isOverbooked: boolean; // If true, needs reassignment
  assignedPartnerId?: string; // If reassigned

  // Operational
  boardingStatus?: 'pending' | 'boarded' | 'no_show'; 
}

export interface Trip {
  id: string;
  date: string;
  time: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  totalSeats: number;
  origin: string; // Starting Point
  destination: string;
  stops?: string[]; // Intermediate stops
  driverName?: string;
  guideName?: string;
  passengers: Passenger[];
}

export interface CompanyProfile {
  name: string;
  address: string; // Default starting point
  addressCoordinates?: Coordinates;
  phone: string;
  email: string;
}