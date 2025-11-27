import * as XLSX from 'xlsx';
import type { InsertClient } from '@shared/schema';

export interface ExcelRow {
  'Company Name': string;
  'Contact Person': string;
  'Email': string;
  'Phone': string;
  'Stage': string;
  'Status': string;
  'Value': number;
  'Priority': string;
  'Responsible Person': string;
  'Country': string;
  'LinkedIn': string;
  'Notes': string;
  'Last Follow-up': string;
  'Next Follow-up': string;
}

export function generateExcelTemplate(): Buffer {
  const headers: (keyof ExcelRow)[] = [
    'Company Name',
    'Contact Person',
    'Email',
    'Phone',
    'Stage',
    'Status',
    'Value',
    'Priority',
    'Responsible Person',
    'Country',
    'LinkedIn',
    'Notes',
    'Last Follow-up',
    'Next Follow-up',
  ];

  const sampleRow: ExcelRow = {
    'Company Name': 'Example Corp',
    'Contact Person': 'John Doe',
    'Email': 'john@example.com',
    'Phone': '+1-555-0123',
    'Stage': 'Lead',
    'Status': 'In Negotiation',
    'Value': 100000,
    'Priority': 'High',
    'Responsible Person': 'Sarah Johnson',
    'Country': 'United States',
    'LinkedIn': 'https://linkedin.com/in/johndoe',
    'Notes': 'Initial contact',
    'Last Follow-up': '2025-11-20',
    'Next Follow-up': '2025-11-27',
  };

  const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');

  // Add info sheet
  const infoWs = XLSX.utils.sheet_add_aoa(XLSX.utils.aoa_to_sheet([
    ['CRM Import Template Instructions'],
    [''],
    ['Stage Options:'],
    ['Lead', 'Qualified', 'Meeting Scheduled', 'Demo Completed', 'Proof of Concept (POC)', 'Proposal Sent', 'Verbal Commitment', 'Contract Review', 'Won', 'Lost'],
    [''],
    ['Status Options (optional):'],
    ['In Negotiation', 'Proposal Rejected', 'On Hold', 'Pending Review', 'Awaiting Response', 'Under Evaluation', 'Budget Approval Pending'],
    [''],
    ['Priority Options:'],
    ['High', 'Medium', 'Low'],
    [''],
    ['Date Format: YYYY-MM-DD'],
    ['Value: Numeric amount (e.g., 100000)'],
  ]), { origin: 'A1' });
  
  XLSX.utils.book_append_sheet(wb, infoWs, 'Instructions');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

export function parseExcelFile(buffer: Buffer): InsertClient[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

  return rows.map((row) => ({
    companyName: row['Company Name']?.trim() || '',
    contactPerson: row['Contact Person']?.trim() || '',
    email: row['Email']?.trim() || '',
    phone: row['Phone']?.trim() || '',
    stage: (row['Stage']?.trim() || 'Lead') as any,
    status: row['Status']?.trim() ? (row['Status'].trim() as any) : null,
    value: typeof row['Value'] === 'number' ? row['Value'].toString() : (row['Value'] || '0').toString(),
    priority: (row['Priority']?.trim() || 'Medium') as any,
    responsiblePerson: row['Responsible Person']?.trim() || 'Unassigned',
    country: row['Country']?.trim() || '',
    linkedin: row['LinkedIn']?.trim() || '',
    notes: row['Notes']?.trim() || '',
    lastFollowUp: row['Last Follow-up'] ? new Date(row['Last Follow-up']).toISOString() : new Date().toISOString(),
    nextFollowUp: row['Next Follow-up'] ? new Date(row['Next Follow-up']).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
