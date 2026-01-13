// Google Wallet Types
export interface LocalizedString {
  defaultValue: { language: string; value: string };
  translatedValues?: { language: string; value: string }[];
}

export interface Image {
  sourceUri: { uri: string };
  contentDescription?: LocalizedString;
}

export interface EventVenue {
  name?: string;
  address?: string;
}

export interface EventDateTime {
  startDate?: string;
  endDate?: string;
  doorsOpenLabel?: string;
}

export interface Message {
  header?: LocalizedString;
  body?: LocalizedString;
}

export interface Uri {
  uri: string;
  description?: string;
}

export interface LatLongPoint {
  latitude: number;
  longitude: number;
}

export interface ImageModuleData {
  mainImage: Image;
  id?: string;
}

export interface TextModuleData {
  header?: string;
  body?: string;
  id?: string;
}

export type ConfirmationCodeLabel = 'CONFIRMATION_CODE' | 'CUSTOM';
export type SeatLabel = 'SEAT' | 'CUSTOM';
export type RowLabel = 'ROW' | 'CUSTOM';
export type SectionLabel = 'SECTION' | 'CUSTOM';
export type GateLabel = 'GATE' | 'CUSTOM';
export type ReviewStatus = 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type MultipleDevicesAndHoldersAllowedStatus = 'ALLOWED' | 'DISALLOWED';
export type ViewUnlockRequirement = 'NONE' | 'PASSWORD';
export type NotificationSettingsForUpdates = 'ENABLED' | 'DISABLED';

export interface EventTicketClass {
  kind?: string;
  eventName?: LocalizedString;
  eventId?: string;
  logo?: Image;
  venue?: EventVenue;
  dateTime?: EventDateTime;
  confirmationCodeLabel?: ConfirmationCodeLabel;
  customConfirmationCodeLabel?: LocalizedString;
  seatLabel?: SeatLabel;
  customSeatLabel?: LocalizedString;
  rowLabel?: RowLabel;
  customRowLabel?: LocalizedString;
  sectionLabel?: SectionLabel;
  customSectionLabel?: LocalizedString;
  gateLabel?: GateLabel;
  customGateLabel?: LocalizedString;
  finePrint?: LocalizedString;
  classTemplateInfo?: Record<string, unknown>;
  id?: string;
  version?: string;
  issuerName?: string;
  messages?: Message[];
  allowMultipleUsersPerObject?: boolean;
  homepageUri?: Uri;
  locations?: LatLongPoint[];
  reviewStatus?: ReviewStatus;
  review?: Record<string, unknown>;
  infoModuleData?: Record<string, unknown>;
  imageModulesData?: ImageModuleData[];
  textModulesData?: TextModuleData[];
  linksModuleData?: Record<string, unknown>;
  redemptionIssuers?: string[];
  countryCode?: string;
  heroImage?: Image;
  wordMark?: Image;
  enableSmartTap?: boolean;
  hexBackgroundColor?: string;
  localizedIssuerName?: LocalizedString;
  multipleDevicesAndHoldersAllowedStatus?: MultipleDevicesAndHoldersAllowedStatus;
  callbackOptions?: Record<string, unknown>;
  securityAnimation?: Record<string, unknown>;
  viewUnlockRequirement?: ViewUnlockRequirement;
  wideLogo?: Image;
  notifyPreference?: NotificationSettingsForUpdates;
  appLinkData?: Record<string, unknown>;
  valueAddedModuleData?: Record<string, unknown>[];
  merchantLocations?: Record<string, unknown>[];
  barcode?: { type: string; value: string };
}

export interface GoogleWalletPassConfigOptions {
  logo?: Image;
  venue?: EventVenue;
  dateTime?: EventDateTime;
  confirmationCodeLabel?: ConfirmationCodeLabel;
  customConfirmationCodeLabel?: LocalizedString;
  issuerName?: string;
  allowMultipleUsersPerObject?: boolean;
  homepageUri?: Uri;
  locations?: LatLongPoint[];
  infoModuleData?: Record<string, unknown>;
  imageModulesData?: ImageModuleData[];
  textModulesData?: TextModuleData[];
  linksModuleData?: Record<string, unknown>;
  countryCode?: string;
  heroImage?: Image;
  enableSmartTap?: boolean;
  hexBackgroundColor?: string;
  localizedIssuerName?: LocalizedString;
  multipleDevicesAndHoldersAllowedStatus?: MultipleDevicesAndHoldersAllowedStatus;
  viewUnlockRequirement?: ViewUnlockRequirement;
  wideLogo?: Image;
  notifyPreference?: NotificationSettingsForUpdates;
  appLinkData?: Record<string, unknown>;
  valueAddedModuleData?: Record<string, unknown>[];
  merchantLocations?: Record<string, unknown>[];
}

// Apple Wallet Types
export interface AppleWalletTemplateConfig {
  description: string;
  organizationName: string;
  passTypeIdentifier: string;
  teamIdentifier: string;
  backgroundColor?: string;
  labelColor?: string;
  foregroundColor?: string;
  sharingProhibited?: boolean;
  maxDistance?: number;
  semantics?: {
    eventType?: string;
    silenceRequested?: boolean;
  };
}

export interface AppleWalletBarcode {
  format:
    | 'PKBarcodeFormatQR'
    | 'PKBarcodeFormatPDF417'
    | 'PKBarcodeFormatAztec'
    | 'PKBarcodeFormatCode128';
  message: string;
  messageEncoding: string;
  altText?: string;
}

export interface AppleWalletPassField {
  key: string;
  label: string;
  value: string | number | Date;
  dateStyle?: string;
  timeStyle?: string;
  changeMessage?: string;
}

export interface AppleWalletPassConfig {
  serialNumber: string;
  logoText?: string;
  voided: boolean;
  authenticationToken: string;
  webServiceURL: string;
  barcodes: AppleWalletBarcode[];
  headerFields: AppleWalletPassField[];
  primaryFields: AppleWalletPassField[];
  secondaryFields: AppleWalletPassField[];
  backFields: AppleWalletPassField[];
}

export interface PassFieldLabels {
  eventLabel: string;
  locationLabel: string;
  ticketNumberLabel: string;
  infoLabel: string;
  slotChangeMessage: string;
  barcodeHint: string;
}

// PDF Renderer Types
export interface BillingAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine?: string;
  city?: string;
  regionCode?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface TicketItem {
  contractStandard?: string;
  contractAddress?: string;
  productId?: string;
  quantity?: number;
  qrCode?: string;
  label?: string;
}

export interface TicketReceiptData {
  title?: string;
  logoUrl?: string;
  orderNumber?: string;
  status?: string;
  date?: Date;
  billingAddress?: BillingAddress;
  confirmed?: Date;
  tickets: TicketItem[];
}
