export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): { bg: string; text: string } {
  switch (status.toLowerCase()) {
    case 'paid':
      return { bg: '#dcfce7', text: '#166534' };
    case 'partial':
      return { bg: '#fef3c7', text: '#92400e' };
    case 'pending':
      return { bg: '#dbeafe', text: '#1e40af' };
    case 'overdue':
      return { bg: '#fee2e2', text: '#991b1b' };
    default:
      return { bg: '#f3f4f6', text: '#374151' };
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
