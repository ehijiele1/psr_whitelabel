export function generateTenantImportCSV(): string {
  const headers = [
    'name',
    'phone',
    'email',
    'unit',
    'unit_type',
    'lease_start',
    'lease_end',
    'rent',
    'security_deposit',
    'pay_freq',
    'status',
  ].join(',');

  const example = [
    'John Doe',
    '08031234567',
    'john@example.com',
    'Apt 1',
    'apartment',
    '2024-01-01',
    '2025-12-31',
    '500000',
    '100000',
    'annual',
    'active',
  ].join(',');

  return `${headers}\n${example}\n`;
}

export function parseImportCSV(csv: string): Record<string, unknown>[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const record: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      if (index < values.length && values[index]) {
        record[header] = values[index];
      }
    });

    return record;
  });
}