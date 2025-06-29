// Form Field Types
export type FieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'qr-scanner'
  | 'geolocation'
  | 'datetime'
  | 'user'
  | 'formula'
  | 'smart-dropdown'
  | 'textarea'
  | 'checkbox';

// Field Options
export interface FieldOptions {
  permanent: boolean;
  mandatory: boolean;
  readOnly: boolean;
  hidden: boolean;
  formula?: string;
  googleSheetColumn: string;
  importCell?: string;
  defaultValue?: string;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
  dropdownOptions?: string[];
  smartDropdownConfig?: {
    relatedField?: string;
    searchField?: string;
    displayField?: string;
    frequencyWeight?: number;
  };
  qrLookupConfig?: {
    tableName: string;
    searchColumn: string;
    returnColumns: string[];
    autoAddRows: boolean;
    targetFields: {
      fieldId: string;
      columnName: string;
      formula?: string;
      isUserInput?: boolean;
    }[];
    googleSheetFormulas?: {
      columnName: string;
      formula: string;
      description: string;
    }[];
  };
}

// Form Field
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  options: FieldOptions;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  styling: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    fontSize: number;
    fontWeight: string;
  };
}

// Form Configuration
export interface FormConfig {
  id: string;
  name: string;
  description?: string;
  backgroundColor?: string;
  fields: FormField[];
  layout: {
    columns: number;
    backgroundColor: string;
    gridSize: number;
  };
  googleSheetId: string;
  googleSheetName: string;
  requiresConfirmation: boolean;
  confirmationRoles: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  allowedUsers?: string[];
  image?: string;
}

// Form Data
export interface FormData {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt?: Date;
  confirmedAt?: Date;
  confirmedBy?: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'rejected';
  exportedToGoogleSheets: boolean;
  exportError?: string;
}

// User Roles
export type UserRole = 'admin' | 'manager' | 'user';

// User
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
  createdAt: Date;
  lastLogin: Date;
}

// Report Configuration
export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  thumbnailSize: {
    width: number;
    height: number;
  };
  dataSource: {
    googleSheetId: string;
    googleSheetName: string;
    range: string;
  };
  displayFields: string[];
  filters?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
    value: any;
  }[];
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  refreshInterval?: number;
}

// Report Data
export interface ReportData {
  id: string;
  reportId: string;
  data: any[];
  lastUpdated: Date;
  error?: string;
}

// Google Sheets Integration
export interface GoogleSheetsConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  spreadsheetId: string;
  credentials?: Record<string, unknown>;
}

// Export Status
export interface ExportStatus {
  success: boolean;
  message: string;
  timestamp: Date;
  retryCount: number;
  data?: any;
}

// App State
export interface AppState {
  currentUser: User | null;
  activeForms: FormConfig[];
  currentFormData: FormData | null;
  reports: ReportConfig[];
  exportQueue: ExportStatus[];
  isOnline: boolean;
  theme: 'light' | 'dark';
  language: 'bs' | 'en';
}

// Diagnostic Information
export interface DiagnosticInfo {
  timestamp: Date;
  component: string;
  action: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
  stackTrace?: string;
}

// Navigation
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
  children?: NavigationItem[];
}

// Toast Notification
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Form Builder State
export interface FormBuilderState {
  selectedField: FormField | null;
  isDragging: boolean;
  gridSnap: boolean;
  showGrid: boolean;
  zoom: number;
  selectedTool: 'select' | 'move' | 'resize' | 'add';
}

// QR Scanner Result
export interface QRScannerResult {
  text: string;
  timestamp: Date;
  fieldId: string;
}

// Geolocation Result
export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  address?: string;
}

// Smart Dropdown Suggestion
export interface SmartDropdownSuggestion {
  value: string;
  display: string;
  frequency: number;
  lastUsed: Date;
  relatedData?: Record<string, any>;
} 