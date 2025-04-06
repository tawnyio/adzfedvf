import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Not specified';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'Unknown';

  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  
  if (diffSecs < 60) {
    return `${diffSecs} secs ago`;
  } else if (diffMins < 60) {
    return `${diffMins} mins ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return `${diffWeeks} weeks ago`;
  }
}

export function getStatusColor(status: string): { bg: string, text: string } {
  switch (status.toLowerCase()) {
    case 'available':
      return { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' };
    case 'generated':
      return { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200' };
    case 'expired':
      return { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' };
    case 'limited':
      return { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200' };
    default:
      return { bg: 'bg-gray-100 dark:bg-gray-900', text: 'text-gray-800 dark:text-gray-200' };
  }
}

export function getCategoryColor(categoryName: string): string {
  // Generate consistent colors based on category name
  const categoryColors: Record<string, string> = {
    'Streaming Vidéo': 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
    'Musique': 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    'Livres / Éducation': 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    'Stockage en ligne / Outils': 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    'Jeux & Abonnements': 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400',
  };
  
  return categoryColors[categoryName] || 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400';
}

export function maskEmail(email: string): string {
  if (!email) return '';
  
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const [username, domain] = parts;
  const maskedUsername = username.length > 3 
    ? username.substring(0, 3) + '***'
    : username.substring(0, 1) + '***';
  
  return `${maskedUsername}@${domain}`;
}
