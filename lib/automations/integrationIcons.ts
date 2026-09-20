import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarDays,
  CreditCard,
  Database,
  HeartPulse,
  Hotel,
  Link2,
  MapPin,
  Share2,
  ShoppingBag,
  Sparkles,
  Truck,
  UtensilsCrossed,
  Users,
  Wrench,
} from "lucide-react";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  ecommerce: ShoppingBag,
  pos_paiement: CreditCard,
  restauration: UtensilsCrossed,
  livraison: Truck,
  rdv: CalendarDays,
  sante: HeartPulse,
  hotellerie: Hotel,
  local: MapPin,
  social: Share2,
  crm: Users,
  erp: Building2,
  ipaas: Link2,
  iPaaS: Link2,
  data: Database,
  immobilier: Building2,
  native: Sparkles,
};

export function integrationIconForCategory(category: string): LucideIcon {
  const key = category.trim();
  return CATEGORY_ICON[key] ?? CATEGORY_ICON[key.toLowerCase()] ?? Wrench;
}

export const INTEGRATION_CATEGORY_LABEL: Record<string, string> = {
  ecommerce: "E-commerce",
  pos_paiement: "Caisse & paiement",
  restauration: "Restauration",
  livraison: "Livraison",
  rdv: "Rendez-vous",
  sante: "Santé",
  hotellerie: "Hôtellerie",
  local: "Commerce local",
  social: "Réseaux sociaux",
  crm: "CRM",
  erp: "ERP",
  ipaas: "Automatisation",
  iPaaS: "Automatisation",
  data: "Données",
  immobilier: "Immobilier",
  native: "Natif",
};

export function integrationCategoryLabel(category: string): string {
  return INTEGRATION_CATEGORY_LABEL[category] ?? category;
}
