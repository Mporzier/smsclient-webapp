import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportContactsModal } from "@/components/smsclient/ImportContactsModal";
import * as clientsApi from "@/lib/supabase/clients";
import { toast as sonnerToast } from "sonner";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    message: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
    custom: vi.fn(),
    dismiss: vi.fn(),
  }),
  Toaster: () => null,
}));

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
    vi.mocked(sonnerToast).mockReset();
    vi.mocked(clientsApi.insertClientsFromImport).mockResolvedValue({
      inserted: 2,
      skippedDuplicateInFile: 0,
      skippedDuplicateInDb: 0,
      duplicatePhoneE164s: [],
      linkedExistingToGroup: 0,
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
        groupOptions={["Clients VIP", "Prospects"]}
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
    const onClose = vi.fn();

    render(
      <ImportContactsModal
        open
        onClose={onClose}
        supabase={mockSupabase}
        userId="user-mock"
        onImported={onImported}
        groupOptions={["Clients VIP", "Prospects"]}
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

    await user.selectOptions(
      screen.getByLabelText("Ajouter au groupe"),
      "Clients VIP",
    );

    await user.click(screen.getByRole("button", { name: /Importer 2 lignes/ }));

    await waitFor(() => {
      expect(clientsApi.insertClientsFromImport).toHaveBeenCalledTimes(1);
      const payloads = vi.mocked(clientsApi.insertClientsFromImport).mock
        .calls[0][2];
      expect(payloads.every((p) => p.groupLabels.includes("Clients VIP"))).toBe(
        true,
      );
      expect(onImported).toHaveBeenCalled();
      expect(sonnerToast).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
