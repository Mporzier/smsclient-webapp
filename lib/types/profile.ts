import type { BusinessActivityId } from "@/lib/types/businessActivity";

export type UserProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  businessActivity: BusinessActivityId | "";
  siret: string;
  tva: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  billingContact: string;
  sender: string;
  notifyInvoices: boolean;
  notifySummary: boolean;
};

export type UserProfile = UserProfileForm & {
  userId: string;
  onboardingCompleted: boolean;
};

export const EMPTY_PROFILE_FORM: UserProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  businessActivity: "",
  siret: "",
  tva: "",
  address: "",
  zip: "",
  city: "",
  country: "France",
  billingContact: "",
  sender: "",
  notifyInvoices: true,
  notifySummary: true,
};
