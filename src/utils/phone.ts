// Pays CEDEAO avec indicatifs téléphoniques (E.164)
export interface CountryOption {
  code: string;       // ISO 2-letter
  name: string;
  dialCode: string;   // +221
  flag: string;       // emoji
  maxLocalLen: number; // longueur du numéro local (sans indicatif)
}

export const CEDEAO_COUNTRIES: CountryOption[] = [
  { code: 'SN', name: 'Sénégal',        dialCode: '+221', flag: '🇸🇳', maxLocalLen: 9 },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮', maxLocalLen: 10 },
  { code: 'ML', name: 'Mali',           dialCode: '+223', flag: '🇲🇱', maxLocalLen: 8 },
  { code: 'BF', name: 'Burkina Faso',   dialCode: '+226', flag: '🇧🇫', maxLocalLen: 8 },
  { code: 'BJ', name: 'Bénin',          dialCode: '+229', flag: '🇧🇯', maxLocalLen: 8 },
  { code: 'TG', name: 'Togo',           dialCode: '+228', flag: '🇹🇬', maxLocalLen: 8 },
  { code: 'NG', name: 'Nigeria',        dialCode: '+234', flag: '🇳🇬', maxLocalLen: 10 },
  { code: 'GH', name: 'Ghana',          dialCode: '+233', flag: '🇬🇭', maxLocalLen: 9 },
  { code: 'GN', name: 'Guinée',         dialCode: '+224', flag: '🇬🇳', maxLocalLen: 9 },
  { code: 'NE', name: 'Niger',          dialCode: '+227', flag: '🇳🇪', maxLocalLen: 8 },
  { code: 'CV', name: 'Cap-Vert',       dialCode: '+238', flag: '🇨🇻', maxLocalLen: 7 },
  { code: 'GM', name: 'Gambie',         dialCode: '+220', flag: '🇬🇲', maxLocalLen: 7 },
  { code: 'GW', name: 'Guinée-Bissau',  dialCode: '+245', flag: '🇬🇼', maxLocalLen: 7 },
  { code: 'LR', name: 'Libéria',        dialCode: '+231', flag: '🇱🇷', maxLocalLen: 8 },
  { code: 'SL', name: 'Sierra Leone',   dialCode: '+232', flag: '🇸🇱', maxLocalLen: 8 },
];

export const DEFAULT_COUNTRY = CEDEAO_COUNTRIES[0]; // Senegal

// Formate un numéro local par groupes de 2-3 chiffres (ex: 77 123 45 67)
export function formatLocalPhone(digits: string, countryCode: string): string {
  const d = digits.replace(/\D/g, '');
  if (countryCode === 'SN' && d.length >= 9) {
    return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`.trim();
  }
  // Default: groups of 2
  return d.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

export function buildE164(dialCode: string, localDigits: string): string {
  return `${dialCode}${localDigits.replace(/\D/g, '')}`;
}

export function maskPhone(e164: string): string {
  // +22177***4567 → masque le milieu
  if (e164.length < 8) return e164;
  const last4 = e164.slice(-4);
  const first = e164.slice(0, 5);
  return `${first}***${last4}`;
}
