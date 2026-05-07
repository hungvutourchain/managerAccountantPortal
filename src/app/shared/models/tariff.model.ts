// Tariff Models based on database structure
export interface TariffData {
  nation: string;
  languageId?: string;
  nameTour: string;
  tourConsultant: string;
  currency: string;
  agentMd5Code: string;
  agentName?: string;
  agentRef?: string;
  agentEmail: string;
  Code: string;
  departureCountry: string;
  departureCity: string;
  finishCountry: string;
  finishCity: string;
  departureLocation: string;
  finishLocation: string;
  countries?: string;
  begindate: DateField;
  enddate: DateField;
  isHalf?: boolean;
  adultQuantity: number;
  childQuantity: number;
  lsChildren: TariffChild[];
  total: number;
  note?: string;
  Tours: TariffTour[];
  days: number;
  nights: number;
  rooms: number;
  comment: string;
  status: string;
  urlPdf?: string;
  UpdateBy?: string;
  UpdateDate?: DateField;
  CreateBy: TariffCreateBy;
  CreateDate?: DateField;
  proposalId?: string;
  markupInfo?: any;
  agencyContacts?: any;
  adminNotes?: any;
  isoReps?: any;
}

export interface DateField {
  $date: string;
}

export interface TariffChild {
  _id: ObjectId;
  No: number;
  age: number;
  price: number;
}

export interface ObjectId {
  $oid: string;
}

export interface TariffCreateBy {
  _id: ObjectId;
  cname: string;
  cemail: string;
}

export interface TariffTour {
  _id: ObjectId;
  Day: number;
  date: DateField;
  Activities: TariffActivity[];
  total: number;
  location: TariffLocation[];
}

export interface TariffActivity {
  forSort?: any;
  adultQuantity: number;
  childQuantity: number;
  total: number;
  isForTourChain: boolean;
  totalNoChild: number;
  lsSurcharge: TariffSurcharge[];
  priceSeparate: TariffPriceSeparate[];
  type: string; // 'DayProgram' | 'OvernightProgram'
  activityId?: string;
  tourId: string;
  nameTour: string;
  IsItem: string;
  parentActivityId: string;
  quantity?: number;
  idHotel?: string;
  idContract?: string;
  idPeriod?: string;
  isItemPeriod?: string;
  idOption?: string;
  idRoom?: string;
  numberRoom?: number;
  exbedAQuantity?: number;
  exbedCQuantity?: number;
  mealPlanAdultQuantity?: number;
  exbedA?: number;
  exbedC?: number;
  mealPlanAdult?: number;
  idFlight?: string;
  flightClass?: string;
  flightFromCity?: string;
  flightToCity?: string;
  content: string;
}

export interface TariffSurcharge {
  _id: ObjectId;
  name: string;
  IsItem: string;
  tariffPeriodName?: string;
  priceSeparate: TariffPriceSeparate[];
  adultQuantity: number;
  childQuantity: number;
  total: number;
  totalNoChild: number;
}

export interface TariffPriceSeparate {
  _id: ObjectId;
  forAdult?: boolean;
  age: number;
  title?: string;
  quantity: number;
  unit: number;
  mealPlanChild?: string;
  mealPlanChildQuantity?: number;
  total: number;
}

export interface TariffLocation {
  _id: ObjectId;
  country: string;
  countryName: string;
  city: string;
  cityName: string;
}

// Response interface from API
export interface TariffResponse {
  success: boolean;
  message?: string;
  data: TariffData;
}

// Mapped tour program interface
export interface TourProgram {
  day: number;
  date: Date | null;
  location: TariffLocation[];
  activities: MappedActivity[];
  total: number;
}

export interface MappedActivity {
  type: string;
  tourId: string;
  nameTour: string;
  content: string;
  total: number;
  adultQuantity: number;
  childQuantity: number;
  priceSeparate: TariffPriceSeparate[];
  surcharges: TariffSurcharge[];
}

// Pricing breakdown interface
export interface PricingBreakdown {
  adultPrice: number;
  childPrice: number;
  totalPrice: number;
  currency: string;
}