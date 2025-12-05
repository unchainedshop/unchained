interface LocalizedString {
  defaultValue: { language: string; value: string };
  translatedValues?: { language: string; value: string }[];
}

interface Image {
  sourceUri: { uri: string };
  contentDescription?: LocalizedString;
}

interface EventVenue {
  name?: string;
  address?: string;
}
interface EventDateTime {
  startDate?: string;
  endDate?: string;
  doorsOpenLabel?: string;
}
interface Message {
  header?: LocalizedString;
  body?: LocalizedString;
}
interface Uri {
  uri: string;
  description?: string;
}
interface LatLongPoint {
  latitude: number;
  longitude: number;
}
interface ImageModuleData {
  mainImage: Image;
  id?: string;
}
interface TextModuleData {
  header?: string;
  body?: string;
  id?: string;
}

type ConfirmationCodeLabel = 'CONFIRMATION_CODE' | 'CUSTOM';
type SeatLabel = 'SEAT' | 'CUSTOM';
type RowLabel = 'ROW' | 'CUSTOM';
type SectionLabel = 'SECTION' | 'CUSTOM';
type GateLabel = 'GATE' | 'CUSTOM';
type ReviewStatus = 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
type MultipleDevicesAndHoldersAllowedStatus = 'ALLOWED' | 'DISALLOWED';
type ViewUnlockRequirement = 'NONE' | 'PASSWORD';
type NotificationSettingsForUpdates = 'ENABLED' | 'DISABLED';

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
  classTemplateInfo?: any;
  id?: string;
  version?: string;
  issuerName?: string;
  messages?: Message[];
  allowMultipleUsersPerObject?: boolean;
  homepageUri?: Uri;
  locations?: LatLongPoint[];
  reviewStatus?: ReviewStatus;
  review?: any;
  infoModuleData?: any;
  imageModulesData?: ImageModuleData[];
  textModulesData?: TextModuleData[];
  linksModuleData?: any;
  redemptionIssuers?: string[];
  countryCode?: string;
  heroImage?: Image;
  wordMark?: Image;
  enableSmartTap?: boolean;
  hexBackgroundColor?: string;
  localizedIssuerName?: LocalizedString;
  multipleDevicesAndHoldersAllowedStatus?: MultipleDevicesAndHoldersAllowedStatus;
  callbackOptions?: any;
  securityAnimation?: any;
  viewUnlockRequirement?: ViewUnlockRequirement;
  wideLogo?: Image;
  notifyPreference?: NotificationSettingsForUpdates;
  appLinkData?: any;
  valueAddedModuleData?: any[];
  merchantLocations?: any[];
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
  infoModuleData?: any;
  imageModulesData?: ImageModuleData[];
  textModulesData?: TextModuleData[];
  linksModuleData?: any;
  countryCode?: string;
  heroImage?: Image;
  enableSmartTap?: boolean;
  hexBackgroundColor?: string;
  localizedIssuerName?: LocalizedString;
  multipleDevicesAndHoldersAllowedStatus?: MultipleDevicesAndHoldersAllowedStatus;
  viewUnlockRequirement?: ViewUnlockRequirement;
  wideLogo?: Image;
  notifyPreference?: NotificationSettingsForUpdates;
  appLinkData?: any;
  valueAddedModuleData?: any[];
  merchantLocations?: any[];
}

export interface PassConfig {
  serialNumber?: string | null;
  barcodes: any[];
  voided: boolean;
  headerFields: any[];
  primaryFields: any[];
  secondaryFields: any[];
  backFields: any[];
  authenticationToken?: string | null;
  webServiceURL?: string | null;
  logoText?: string | null;
}
