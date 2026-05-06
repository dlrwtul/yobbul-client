import type { PackageType } from '../types/order.types';

export interface Category {
  id: PackageType | 'other';
  label: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { id: 'standard', label: 'Colis',    emoji: '📦' },
  { id: 'food',     label: 'Repas',    emoji: '🍔' },
  { id: 'standard', label: 'Courses',  emoji: '🛒' },
  { id: 'document', label: 'Document', emoji: '📄' },
  { id: 'other',    label: 'Autre',    emoji: '➕' },
];

// Emoji for a given package type (for OrderCard)
export const PACKAGE_ICONS: Record<PackageType, string> = {
  standard: '📦',
  fragile:  '🔶',
  food:     '🍔',
  document: '📄',
  liquid:   '🧴',
};
