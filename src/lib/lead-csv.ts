export interface LeadCsvRow {
  rowNumber: number; name: string; phone: string; email?: string; source?: string; notes?: string;
  intent?: string; timeline?: string; region?: string; propertyType?: string; budgetCurrency?: string; budgetAmount?: number;
}

const aliases: Record<string, keyof LeadCsvRow> = {
  name: 'name', fullname: 'name', contactname: 'name', phone: 'phone', mobile: 'phone', phonenumber: 'phone',
  email: 'email', emailaddress: 'email', source: 'source', leadsource: 'source', notes: 'notes', intent: 'intent',
  timeline: 'timeline', region: 'region', location: 'region', propertytype: 'propertyType', type: 'propertyType',
  budgetamount: 'budgetAmount', budget: 'budgetAmount', budgetcurrency: 'budgetCurrency', currency: 'budgetCurrency',
};

function parseRecords(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
      continue;
    }
    if (char === '"' && field.length === 0) { quoted = true; continue; }
    if (char === ',') { row.push(field); field = ''; continue; }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field); field = '';
      if (row.some((value) => value.trim() !== '')) records.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  row.push(field);
  if (row.some((value) => value.trim() !== '')) records.push(row);
  return records;
}

export function parseLeadCsv(text: string): LeadCsvRow[] {
  const records = parseRecords(text.replace(/^\uFEFF/, ''));
  if (records.length < 2) throw new Error('CSV must contain a header and at least one data row.');
  const header = records[0].map((value) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const columns = header.map((value) => aliases[value]);
  if (!columns.includes('name') || !columns.includes('phone')) throw new Error('CSV must include Name and Phone columns.');
  if (new Set(columns.filter(Boolean)).size !== columns.filter(Boolean).length) throw new Error('CSV contains duplicate mapped columns.');
  const rows = records.slice(1).map((values, index) => {
    if (values.length !== columns.length) throw new Error(`CSV row ${index + 2} has ${values.length} columns; expected ${columns.length}.`);
    const mapped: Record<string, string> = {};
    columns.forEach((column, columnIndex) => { if (column) mapped[column] = values[columnIndex].trim(); });
    const amountText = mapped.budgetAmount?.replace(/,/g, '');
    const budgetAmount = amountText ? Number(amountText) : undefined;
    if (amountText && !Number.isFinite(budgetAmount)) throw new Error(`Budget in row ${index + 2} is not a valid number.`);
    return {
      rowNumber: index + 2, name: mapped.name ?? '', phone: mapped.phone ?? '',
      ...(mapped.email ? { email: mapped.email } : {}), ...(mapped.source ? { source: mapped.source } : {}),
      ...(mapped.notes ? { notes: mapped.notes } : {}), ...(mapped.intent ? { intent: mapped.intent } : {}),
      ...(mapped.timeline ? { timeline: mapped.timeline } : {}), ...(mapped.region ? { region: mapped.region } : {}),
      ...(mapped.propertyType ? { propertyType: mapped.propertyType } : {}), ...(mapped.budgetCurrency ? { budgetCurrency: mapped.budgetCurrency.toUpperCase() } : {}),
      ...(budgetAmount !== undefined ? { budgetAmount } : {}),
    } satisfies LeadCsvRow;
  });
  if (rows.length > 500) throw new Error('A single import can contain at most 500 non-empty data rows.');
  return rows;
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string | number | null | undefined) => {
    let text = value == null ? '' : String(value);
    if (['=', '+', '@', '-'].includes(text.trimStart()[0] ?? '')) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const content = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}
