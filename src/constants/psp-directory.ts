// Stub PSP directory — replaced at handover by data from the admin dashboard.
// Mirrors the "Know Your PSP" campaign data structure LAWMA publishes.

import type { LagosLga } from './index';

export type PspContact = {
  name: string;
  contactName?: string;
  phone: string;
  whatsapp?: string;
  zone: string;
};

export const PSP_DIRECTORY: Record<LagosLga, PspContact> = {
  'Agege':            { name: 'AGB Waste Services Ltd',          phone: '08055000101', whatsapp: '2348055000101', zone: 'West I' },
  'Ajeromi-Ifelodun': { name: 'Riverstone Sanitation Co.',       phone: '08055000102', whatsapp: '2348055000102', zone: 'West II' },
  'Alimosho':         { name: 'GreenMile PSP Operators',         phone: '08055000103', whatsapp: '2348055000103', zone: 'West I' },
  'Amuwo-Odofin':     { name: 'Coastal Clean Logistics',         phone: '08055000104', whatsapp: '2348055000104', zone: 'West II' },
  'Apapa':            { name: 'Harbour Waste Management',        phone: '08055000105', whatsapp: '2348055000105', zone: 'Central I' },
  'Badagry':          { name: 'Border Sanitation Services',      phone: '08055000106', whatsapp: '2348055000106', zone: 'West II' },
  'Epe':              { name: 'EastWaters PSP',                  phone: '08055000107', whatsapp: '2348055000107', zone: 'East II' },
  'Eti-Osa':          { name: 'Lekki Coastal Operators',         phone: '08055000108', whatsapp: '2348055000108', zone: 'East I' },
  'Ibeju-Lekki':      { name: 'IBEJU Eco Services',              phone: '08055000109', whatsapp: '2348055000109', zone: 'East II' },
  'Ifako-Ijaiye':     { name: 'IfakoCare Waste Co.',             phone: '08055000110', whatsapp: '2348055000110', zone: 'West I' },
  'Ikeja':            { name: 'Capital Waste Operators',         phone: '08055000111', whatsapp: '2348055000111', zone: 'Central I' },
  'Ikorodu':          { name: 'Ikorodu Regional Sanitation',     phone: '08055000112', whatsapp: '2348055000112', zone: 'East II' },
  'Kosofe':           { name: 'Kosofe Waste Partners',           phone: '08055000113', whatsapp: '2348055000113', zone: 'Central II' },
  'Lagos Island':     { name: 'Island Sanitation Services',      phone: '08055000114', whatsapp: '2348055000114', zone: 'Central I' },
  'Lagos Mainland':   { name: 'Mainland Eco Operators',          phone: '08055000115', whatsapp: '2348055000115', zone: 'Central II' },
  'Mushin':           { name: 'Mushin Clean Co.',                phone: '08055000116', whatsapp: '2348055000116', zone: 'Central II' },
  'Ojo':              { name: 'Ojo Waste Services',              phone: '08055000117', whatsapp: '2348055000117', zone: 'West II' },
  'Oshodi-Isolo':     { name: 'Oshodi Sanitation Operators',     phone: '08055000118', whatsapp: '2348055000118', zone: 'Central II' },
  'Shomolu':          { name: 'Shomolu Eco Waste',               phone: '08055000119', whatsapp: '2348055000119', zone: 'Central II' },
  'Surulere':         { name: 'Surulere Refuse Management',      phone: '08055000120', whatsapp: '2348055000120', zone: 'Central I' },
};
