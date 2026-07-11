import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportContactsModal } from "@/components/smsclient/ImportContactsModal";
import * as clientsApi from "@/lib/supabase/clients";

vi.mock("@/lib/supabase/clients", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/clients")>();
  return {
    ...actual,
    insertClientsFromImport: vi.fn(),
  };
});

const mockSupabase = {} as import("@supabase/supabase-js").SupabaseClient;

describe("Import contacts — flow (intégration, mock API)", () => {
  beforeEach(() => {
    vi.mocked(clientsApi.insertClientsFromImport).mockReset();
    vi.mocked(clientsApi.insertClientsFromImport).mockResolvedValue({
      inserted: 2,
      skippedDuplicateInFile: 0,
      skippedDuplicateInDb: 0,
      skippedInvalidRow: 0,
      otherErrors: 0,
    });
  });

  it("ouvre la modale et affiche la zone de dépôt CSV", () => {
    render(
      <ImportContactsModal
        open
        onClose={() => {}}
        supabase={mockSupabase}
        userId="user-mock"
        onImported={async () => {}}
        onNotify={() => {}}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Importer des contacts" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Glissez-déposez un fichier CSV ici"),
    ).toBeInTheDocument();
  });

  it("importe un CSV via insertClientsFromImport mocké", async () => {
    const user = userEvent.setup();
    const onImported = vi.fn().mockResolvedValue(undefined);
    const onNotify = vi.fn();
    const onClose = vi.fn();

    render(
      <ImportContactsModal
        open
        onClose={onClose}
        supabase={mockSupabase}
        userId="user-mock"
        onImported={onImported}
        onNotify={onNotify}
      />,
    );

    const csv = `Prénom;Nom;Téléphone;Groupe
Alice;Martin;06 12 34 56 78;Clients VIP
Bob;Durand;06 98 76 54 32;Prospects`;

    const file = new File([csv], "contacts.csv", { type: "text/csv" });
    const input = document.getElementById(
      "import-contacts-csv-input",
    ) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/2 lignes détectées/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Importer 2 lignes/ }));

    await waitFor(() => {
      expect(clientsApi.insertClientsFromImport).toHaveBeenCalledTimes(1);
      expect(onImported).toHaveBeenCalled();
      expect(onNotify).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
