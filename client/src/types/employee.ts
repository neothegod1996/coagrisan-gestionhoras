import { PaginationResponse, Response } from ".";
import { Location } from "./location";
import { Profile } from "./profile";
import { Schedule } from "./schedule";
import { Agreement } from "./agreement";

export interface Employee {
  id: string;
  card_id: string;
  employee_code?: string;
  first_name: string;
  last_name: string;
  dni: string;
  email: string;
  profile: Profile;
  location: Location;
  schedule: Schedule;
}

export interface Turnover {
  id: string;
  date: Date;
  type: 'hiring' | 'departure';
  reason?: string;
  comment?: string;
  created_at: Date;
}

export interface FullEmployee {
  id: string;
  card_id: string;
  device_pin?: string;
  employee_code?: string;
  first_name: string;
  last_name: string;
  dni: string;
  birth_date: Date;
  address: string;
  postal_code: string;
  province: string;
  population: string;
  phone_number?: string;
  mobile_number: string;
  email: string;
  alias: string;
  profile: Profile;
  schedule: Schedule;
  location: Location;
  is_responsible: boolean;
  agreements: { agreement: Pick<Agreement, 'id' | 'name'> }[];
  status: 'active' | 'inactive';
  employee_turnover?: Turnover[];
}

export interface EmployeeFormData {
  card_id: string;
  device_pin?: string;
  employee_code?: string;
  first_name: string;
  last_name: string;
  dni: string;
  birth_date: Date;
  address: string;
  postal_code: string;
  province: string;
  population: string;
  phone_number?: string;
  mobile_number: string;
  email: string;
  profile_id: string;
  schedule_id: string;
  location_id: string;
  is_responsible?: boolean;
  status?: 'active' | 'inactive';
  turnover_date?: Date;
  turnover_reason?: string;
  turnover_comment?: string;
}

export interface OnboardingOffboardingHistory {
  id: string;
  employee_id: string;
  type: OnboardingOffboardingType;
  date: Date;
  reason: string;
  observations?: string;
  created_by: string;
}
export enum OnboardingOffboardingType {
  Onboarding = 'onboarding',
  Offboarding = 'offboarding',
}

export interface EmployeeFilters {
  page: number;
  search: string;
  limit?: number;
  profile?: string;
  location?: string;
  center?: string;
}

export type EmployeeAction = 'view' | 'edit' | 'delete';

export type EmployeeResponse = PaginationResponse<Employee>;
export type FullEmployeeResponse = Response<FullEmployee>;