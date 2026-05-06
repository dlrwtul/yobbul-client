// Format a date as a relative time in French: "Il y a 2 jours", "Il y a 5 min", "Hier", "À l'instant"
export function relativeDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  const diffMs = Date.now() - d.getTime();
  const s = Math.floor(diffMs / 1000);

  if (s < 60) return 'À l\'instant';
  const m = Math.floor(s / 60);
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatPrice(amount: number, currency = 'FCFA'): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
}

// Truncate address to max N chars with ellipsis
export function truncate(str: string, max = 35): string {
  return str.length <= max ? str : `${str.slice(0, max - 1).trimEnd()}…`;
}
