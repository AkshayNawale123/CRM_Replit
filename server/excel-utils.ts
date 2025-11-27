import * as XLSX from 'xlsx';

export interface ExcelRow {
  'Company Name': string;
  'Contact Person': string;
  'Email': string;
  'Phone': string;
  'Stage': string;
  'Status': string;
  'Value': number | string;
  'Priority': string;
  'Responsible Person': string;
  'Country': string;
  'Service': string;
  'LinkedIn': string;
  'Notes': string;
  'Last Follow-up': string;
  'Next Follow-up': string;
}

export interface ParsedClient {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  stage: string;
  status: string | null;
  value: number;
  priority: string;
  responsiblePerson: string;
  country: string;
  service: string;
  linkedin: string;
  notes: string;
  lastFollowUp: string;
  nextFollowUp: string;
  activityHistory: any[];
}

const VALID_STAGES = [
  'Lead', 'Qualified', 'Meeting Scheduled', 'Demo Completed', 
  'Proof of Concept (POC)', 'Proposal Sent', 'Verbal Commitment', 
  'Contract Review', 'Won', 'Lost'
];

const VALID_STATUSES = [
  'In Negotiation', 'Proposal Rejected', 'On Hold', 
  'Pending Review', 'Awaiting Response', 'Under Evaluation', 
  'Budget Approval Pending'
];

const VALID_PRIORITIES = ['High', 'Medium', 'Low'];

const VALID_SERVICES = [
  'Product Development', 'CRM', 'ERP', 'Mobile Development',
  'Website Creation', 'Digital Marketing', 'ITSM'
];

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
    'Service',
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
    'Status': '',
    'Value': 100000,
    'Priority': 'High',
    'Responsible Person': 'Sarah Johnson',
    'Country': 'United States',
    'Service': 'CRM',
    'LinkedIn': 'https://linkedin.com/in/johndoe',
    'Notes': 'Initial contact',
    'Last Follow-up': '2025-11-20',
    'Next Follow-up': '2025-11-27',
  };

  const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
  
  ws['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 25 },
    { wch: 15 },
    { wch: 22 },
    { wch: 22 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 15 },
    { wch: 20 },
    { wch: 30 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');

  const instructionData = [
    ['CRM Import Template Instructions'],
    [''],
    ['Stage Options (Required):'],
    ['Lead, Qualified, Meeting Scheduled, Demo Completed, Proof of Concept (POC), Proposal Sent, Verbal Commitment, Contract Review, Won, Lost'],
    [''],
    ['Status Options (Optional - leave empty if not applicable):'],
    ['In Negotiation, Proposal Rejected, On Hold, Pending Review, Awaiting Response, Under Evaluation, Budget Approval Pending'],
    [''],
    ['Priority Options (Required):'],
    ['High, Medium, Low'],
    [''],
    ['Service Options (Required):'],
    ['Product Development, CRM, ERP, Mobile Development, Website Creation, Digital Marketing, ITSM'],
    ['Note: You can also use custom service names - they will be added to the system automatically'],
    [''],
    ['Country Options (Required - must match exactly):'],
    ['United States, United Kingdom, India, Canada, Australia, Germany, France, Japan, China, Singapore, United Arab Emirates, Saudi Arabia, Netherlands, Switzerland, Sweden, Brazil, Mexico, South Korea, etc.'],
    [''],
    ['Date Format: YYYY-MM-DD (e.g., 2025-11-20)'],
    ['Value: Numeric amount in the local currency of the selected country (e.g., 100000). Currency is auto-detected based on country.'],
    [''],
    ['Notes:'],
    ['- Delete the sample row before importing your data'],
    ['- All fields except Status, LinkedIn, and Notes are required'],
    ['- Email must be valid format'],
    ['- Country name must match exactly for currency detection'],
  ];
  
  const infoWs = XLSX.utils.aoa_to_sheet(instructionData);
  infoWs['!cols'] = [{ wch: 100 }];
  
  XLSX.utils.book_append_sheet(wb, infoWs, 'Instructions');

  return Buffer.from(XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));
}

function parseDate(dateStr: string | undefined, defaultDate: Date): string {
  if (!dateStr || dateStr.trim() === '') {
    return defaultDate.toISOString();
  }
  
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return defaultDate.toISOString();
  }
  
  return parsed.toISOString();
}

function validateStage(stage: string | undefined): string {
  if (!stage) return 'Lead';
  const trimmed = stage.trim();
  return VALID_STAGES.includes(trimmed) ? trimmed : 'Lead';
}

function validateStatus(status: string | undefined): string | null {
  if (!status || status.trim() === '') return null;
  const trimmed = status.trim();
  return VALID_STATUSES.includes(trimmed) ? trimmed : null;
}

function validatePriority(priority: string | undefined): string {
  if (!priority) return 'Medium';
  const trimmed = priority.trim();
  return VALID_PRIORITIES.includes(trimmed) ? trimmed : 'Medium';
}

function parseValue(value: number | string | undefined): number {
  if (value === undefined || value === null || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) ? 0 : Math.max(0, num);
}

function validateService(service: string | undefined): string {
  if (!service || service.trim() === '') return 'Product Development';
  return service.trim();
}

export function parseExcelFile(buffer: Buffer): ParsedClient[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

  const now = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return rows.map((row) => ({
    companyName: row['Company Name']?.toString().trim() || '',
    contactPerson: row['Contact Person']?.toString().trim() || '',
    email: row['Email']?.toString().trim() || '',
    phone: row['Phone']?.toString().trim() || '',
    stage: validateStage(row['Stage']?.toString()),
    status: validateStatus(row['Status']?.toString()),
    value: parseValue(row['Value']),
    priority: validatePriority(row['Priority']?.toString()),
    responsiblePerson: row['Responsible Person']?.toString().trim() || 'Unassigned',
    country: row['Country']?.toString().trim() || '',
    service: validateService(row['Service']?.toString()),
    linkedin: row['LinkedIn']?.toString().trim() || '',
    notes: row['Notes']?.toString().trim() || '',
    lastFollowUp: parseDate(row['Last Follow-up']?.toString(), now),
    nextFollowUp: parseDate(row['Next Follow-up']?.toString(), nextWeek),
    activityHistory: [],
  }));
}

export function validateExcelFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  
  const maxSize = 5 * 1024 * 1024;
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 5MB' };
  }
  
  return { valid: true };
}
