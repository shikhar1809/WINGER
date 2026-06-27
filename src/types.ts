export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  trustedContacts: TrustedContact[];
  emergencyMessage: string;
  isOnboarded: boolean;
  isWorking: boolean;
  pinCode?: string;
}

export interface IncidentLog {
  id: string;
  userId: string;
  imageUrl: string;
  geminiLabel: string;
  lat: number;
  lng: number;
  timestamp: string;
  deviceId: string;
  description: string;
}

export interface EmergencyLog {
  id: string;
  userId: string;
  videoUrl?: string; // or base64 audio/video
  lat: number;
  lng: number;
  policeStation: {
    name: string;
    distance: string;
    address: string;
    phone: string;
  };
  notifiedContacts: TrustedContact[];
  timestamp: string;
  status: 'active' | 'resolved';
}

export interface CrimeIncident {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string;
  city: string;
  locationName: string;
}

export interface RouteOption {
  id: string;
  name: string;
  distance: string;
  duration: string;
  safetyScore: number; // 0-100
  safetyBand: 'Safe' | 'Caution' | 'Danger'; // Green, Yellow, Red
  crimeCount: number;
  nudge: string;
  coordinates: [number, number][]; // lat, lng list
}
