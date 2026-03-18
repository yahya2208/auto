import { CAR_BRANDS_EU } from './carBrandsEU';
import { CAR_BRANDS_ASIAN } from './carBrandsAsian';
import { CAR_BRANDS_AMERICAS } from './carBrandsAmericas';

export const ALL_CAR_BRANDS: Record<string, string[]> = {
  ...CAR_BRANDS_EU,
  ...CAR_BRANDS_ASIAN,
  ...CAR_BRANDS_AMERICAS,
  // Additional Luxury/Other
  "Bentley": ["Bentayga (2025)", "Continental GT (2025)", "Flying Spur (2025)", "Mulsanne", "Arnage"],
  "Rolls-Royce": ["Spectre (2025)", "Phantom (2025)", "Cullinan (2025)", "Ghost (2025)", "Dawn", "Wraith"],
  "Aston Martin": ["DB12 (2025)", "Vantage (2025)", "DBS (2025)", "DBX (2025)", "Vanquish"],
  "McLaren": ["Artura (2025)", "750S (2025)", "GT (2025)", "720S", "570S", "P1"],
  "Bugatti": ["Tourbillon (2025)", "Chiron", "Veyron", "EB110"],
  "Maserati": ["Grecale (2025)", "GranTurismo (2025)", "Levante (2025)", "MC20 (2025)", "Ghibli", "Quattroporte"],
  "Genesis": ["GV80 (2025)", "GV70 (2025)", "G90 (2025)", "G80 (2025)", "G70 (2025)", "GV60 (2025)"],
};

export { WILAYAS } from './wilayas';
