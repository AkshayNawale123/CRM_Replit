import * as XLSX from 'xlsx';
import { stageStatusMapping } from '@shared/schema';

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
  'Source': string;
  'Industry': string;
  'Estimated Close Date': string;
  'Win Probability (%)': number | string;
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
  source?: string;
  industry?: string;
  estimatedCloseDate?: string;
  winProbability?: number;
}

export interface ValidationWarning {
  row: number;
  field: string;
  warning: string;
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

const VALID_SOURCES = [
  'Referral', 'Website', 'Event', 'Cold Outreach', 'Partner', 'Other'
];

function addDataValidation(ws: XLSX.WorkSheet, column: string, options: string[], startRow: number = 2, endRow: number = 1000): void {
  if (!ws['!dataValidation']) {
    ws['!dataValidation'] = [];
  }
  
  const validationFormula = `"${options.join(',')}"`;
  
  (ws['!dataValidation'] as any[]).push({
    sqref: `${column}${startRow}:${column}${endRow}`,
    type: 'list',
    formula1: validationFormula,
    showDropDown: true,
    allowBlank: true,
  });
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
    'Service',
    'Source',
    'Industry',
    'Estimated Close Date',
    'Win Probability (%)',
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
    'Source': 'Website',
    'Industry': 'Technology',
    'Estimated Close Date': '2025-12-31',
    'Win Probability (%)': 50,
    'LinkedIn': 'https://linkedin.com/in/johndoe',
    'Notes': 'Initial contact',
    'Last Follow-up': '2025-11-20',
    'Next Follow-up': '2025-11-27',
  };

  const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
  
  ws['!cols'] = [
    { wch: 20 },  // Company Name
    { wch: 18 },  // Contact Person
    { wch: 25 },  // Email
    { wch: 15 },  // Phone
    { wch: 22 },  // Stage
    { wch: 22 },  // Status
    { wch: 12 },  // Value
    { wch: 12 },  // Priority
    { wch: 18 },  // Responsible Person
    { wch: 15 },  // Country
    { wch: 20 },  // Service
    { wch: 15 },  // Source
    { wch: 18 },  // Industry
    { wch: 18 },  // Estimated Close Date
    { wch: 18 },  // Win Probability
    { wch: 30 },  // LinkedIn
    { wch: 30 },  // Notes
    { wch: 15 },  // Last Follow-up
    { wch: 15 },  // Next Follow-up
  ];

  addDataValidation(ws, 'E', VALID_STAGES);
  addDataValidation(ws, 'F', ['', ...VALID_STATUSES]);
  addDataValidation(ws, 'H', VALID_PRIORITIES);
  addDataValidation(ws, 'K', VALID_SERVICES);
  addDataValidation(ws, 'L', VALID_SOURCES);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');

  const instructionData = [
    ['CRM Import Template Instructions'],
    [''],
    ['=== REQUIRED FIELDS ==='],
    [''],
    ['Stage Options (Required):'],
    ['Lead, Qualified, Meeting Scheduled, Demo Completed, Proof of Concept (POC), Proposal Sent, Verbal Commitment, Contract Review, Won, Lost'],
    [''],
    ['Priority Options (Required):'],
    ['High, Medium, Low'],
    [''],
    ['Service Options (Required):'],
    ['Product Development, CRM, ERP, Mobile Development, Website Creation, Digital Marketing, ITSM'],
    ['Note: You can also use custom service names - they will be added to the system automatically'],
    [''],
    ['Country (Required - must match exactly):'],
    ['United States, United Kingdom, India, Canada, Australia, Germany, France, Japan, China, Singapore, United Arab Emirates, Saudi Arabia, Netherlands, Switzerland, Sweden, Brazil, Mexico, South Korea, etc.'],
    [''],
    ['=== OPTIONAL FIELDS ==='],
    [''],
    ['Status Options (Optional - leave empty if not applicable):'],
    ['In Negotiation, Proposal Rejected, On Hold, Pending Review, Awaiting Response, Under Evaluation, Budget Approval Pending'],
    [''],
    ['IMPORTANT: Stage-Status Compatibility'],
    ['Each stage only accepts certain statuses. If you use an incompatible combination, you will receive a warning:'],
    ['  - Lead: Awaiting Response'],
    ['  - Qualified: Under Evaluation, Pending Review'],
    ['  - Meeting Scheduled: Awaiting Response'],
    ['  - Demo Completed: Under Evaluation, Awaiting Response'],
    ['  - Proof of Concept (POC): In Negotiation, Under Evaluation, Pending Review'],
    ['  - Proposal Sent: Pending Review, Under Evaluation, On Hold'],
    ['  - Verbal Commitment: Budget Approval Pending, Pending Review'],
    ['  - Contract Review: In Negotiation, Pending Review, On Hold'],
    ['  - Won: (no status allowed)'],
    ['  - Lost: Proposal Rejected, On Hold'],
    [''],
    ['Source Options (Optional):'],
    ['Referral, Website, Event, Cold Outreach, Partner, Other'],
    [''],
    ['Industry (Optional):'],
    ['Free text field - enter the industry name (e.g., Technology, Healthcare, Finance, Manufacturing, Retail)'],
    [''],
    ['Estimated Close Date (Optional):'],
    ['Date format: YYYY-MM-DD (e.g., 2025-12-31)'],
    [''],
    ['Win Probability (Optional):'],
    ['Number from 0 to 100 representing percentage likelihood of winning the deal'],
    [''],
    ['=== FORMATTING GUIDELINES ==='],
    [''],
    ['Date Format: YYYY-MM-DD (e.g., 2025-11-20)'],
    ['Value: Numeric amount in the local currency of the selected country (e.g., 100000). Currency is auto-detected based on country.'],
    ['Win Probability: Number 0-100 (no % sign needed)'],
    [''],
    ['=== NOTES ==='],
    [''],
    ['- Delete the sample row before importing your data'],
    ['- Company Name, Contact Person, Email, Phone, Stage, Priority, Country, and Service are required'],
    ['- Email must be a valid email format'],
    ['- Country name must match exactly for currency detection'],
    ['- Dropdown menus are available in the Clients sheet for Stage, Status, Priority, Service, and Source columns'],
    ['- LinkedIn and Notes are optional free-text fields'],
  ];
  
  const infoWs = XLSX.utils.aoa_to_sheet(instructionData);
  infoWs['!cols'] = [{ wch: 120 }];
  
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

function parseOptionalDate(dateStr: string | undefined): string | undefined {
  if (!dateStr || dateStr.trim() === '') {
    return undefined;
  }
  
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return undefined;
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

function validateSource(source: string | undefined): string | undefined {
  if (!source || source.trim() === '') return undefined;
  const trimmed = source.trim();
  return VALID_SOURCES.includes(trimmed) ? trimmed : 'Other';
}

function parseWinProbability(value: number | string | undefined): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = typeof value === 'number' ? value : parseFloat(value.toString().replace('%', ''));
  if (isNaN(num)) return undefined;
  return Math.min(100, Math.max(0, Math.round(num)));
}

function parseOptionalIndustry(industry: string | undefined): string | undefined {
  if (!industry || industry.trim() === '') return undefined;
  return industry.trim();
}

export function validateStageStatusCompatibility(stage: string, status: string | null): { valid: boolean; warning?: string } {
  if (status === null || status === '') {
    return { valid: true };
  }
  
  const validStatuses = stageStatusMapping[stage] || [null];
  
  if (!validStatuses.includes(status)) {
    const validOptions = validStatuses.filter(s => s !== null);
    const validOptionsText = validOptions.length > 0 
      ? `Valid statuses for "${stage}" are: ${validOptions.join(', ')}, or leave empty`
      : `Stage "${stage}" does not accept any status. Please leave the status field empty.`;
    
    return {
      valid: false,
      warning: `Status "${status}" is not compatible with stage "${stage}". ${validOptionsText}`
    };
  }
  
  return { valid: true };
}

export interface ParseResult {
  clients: ParsedClient[];
  warnings: ValidationWarning[];
}

export function parseExcelFile(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

  const now = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  const clients: ParsedClient[] = [];
  const warnings: ValidationWarning[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    
    const stage = validateStage(row['Stage']?.toString());
    const status = validateStatus(row['Status']?.toString());
    
    const compatibility = validateStageStatusCompatibility(stage, status);
    if (!compatibility.valid && compatibility.warning) {
      warnings.push({
        row: rowNum,
        field: 'Status',
        warning: compatibility.warning
      });
    }
    
    clients.push({
      companyName: row['Company Name']?.toString().trim() || '',
      contactPerson: row['Contact Person']?.toString().trim() || '',
      email: row['Email']?.toString().trim() || '',
      phone: row['Phone']?.toString().trim() || '',
      stage,
      status,
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
      source: validateSource(row['Source']?.toString()),
      industry: parseOptionalIndustry(row['Industry']?.toString()),
      estimatedCloseDate: parseOptionalDate(row['Estimated Close Date']?.toString()),
      winProbability: parseWinProbability(row['Win Probability (%)'])
    });
  });

  return { clients, warnings };
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
