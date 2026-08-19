"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

/** Bloc encadré pour le contenu des modales Paramètres (factures, champs perso…). */
export function ModalPanel({ children }: { children: ReactNode }) {
  return (
    <Card size="sm">
      <CardContent className="grid gap-3">{children}</CardContent>
    </Card>
  );
}
