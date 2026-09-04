import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupesFlowHarness } from "./harness/GroupesFlowHarness";
import {
  makeContact,
  makeGroup,
  resetMockIds,
} from "./helpers/mockData";

describe("Groupes — flows (intégration, mocks)", () => {
  beforeEach(() => {
    resetMockIds();
  });

  it("affiche l'état vide et le bouton de création", () => {
    render(<GroupesFlowHarness />);

    expect(screen.getByText("Aucun groupe trouvé")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Créer un groupe" }),
    ).toBeInTheDocument();
  });

  it("affiche la liste des groupes mockés", () => {
    render(
      <GroupesFlowHarness
        initialGroups={[
          makeGroup({ name: "Clients VIP" }),
          makeGroup({ id: "group-2", name: "Prospects" }),
        ]}
      />,
    );

    expect(screen.getByText("Clients VIP")).toBeInTheDocument();
    expect(screen.getByText("Prospects")).toBeInTheDocument();
    expect(screen.getByText("2 groupes")).toBeInTheDocument();
  });

  it("ouvre et ferme la modale de création", async () => {
    const user = userEvent.setup();
    render(<GroupesFlowHarness />);

    await user.click(screen.getByRole("button", { name: "Créer un groupe" }));
    expect(
      screen.getByRole("dialog", { name: "Créer un groupe" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Aucun contact enregistré/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Annuler" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("crée un groupe avec description", async () => {
    const user = userEvent.setup();
    render(<GroupesFlowHarness />);

    await user.click(screen.getByRole("button", { name: "Créer un groupe" }));
    await user.type(
      screen.getByPlaceholderText("Ex. Clients VIP"),
      "Segment E2E",
    );
    await user.type(
      screen.getByPlaceholderText(/Ex\. Clients VIP, relance juin/),
      "Créé en test",
    );
    await user.click(screen.getByRole("button", { name: "Créer le groupe" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Segment E2E")).toBeInTheDocument();
    expect(screen.getByText("Créé en test")).toBeInTheDocument();
    expect(screen.getByText("1 groupe")).toBeInTheDocument();
  });

  it("filtre les groupes via la recherche", async () => {
    const user = userEvent.setup();
    render(
      <GroupesFlowHarness
        initialGroups={[
          makeGroup({ name: "Clients VIP" }),
          makeGroup({ id: "group-2", name: "Prospects" }),
        ]}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Rechercher un groupe..."),
      "Prospects",
    );

    expect(screen.getByText("Prospects")).toBeInTheDocument();
    expect(screen.queryByText("Clients VIP")).not.toBeInTheDocument();
  });

  it("modifie un groupe depuis la liste", async () => {
    const user = userEvent.setup();
    render(
      <GroupesFlowHarness
        initialGroups={[makeGroup({ name: "Clients VIP", description: "Avant" })]}
      />,
    );

    await user.click(screen.getByText("Clients VIP"));
    const dialog = screen.getByRole("dialog", { name: "Modifier le groupe" });
    const description = within(dialog).getByPlaceholderText(
      /Ex\. Clients VIP, relance juin/,
    );
    await user.clear(description);
    await user.type(description, "Après modification");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Après modification")).toBeInTheDocument();
  });

  it("rattache des contacts lors de la création d'un groupe", async () => {
    const user = userEvent.setup();
    render(
      <GroupesFlowHarness
        initialContacts={[
          makeContact({ firstName: "Alice", lastName: "Martin" }),
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Créer un groupe" }));
    await user.type(
      screen.getByPlaceholderText("Ex. Clients VIP"),
      "VIP",
    );

    const dialog = screen.getByRole("dialog", { name: "Créer un groupe" });
    await user.click(within(dialog).getByLabelText(/Sélectionner Alice/));
    await user.click(screen.getByRole("button", { name: "Créer le groupe" }));

    await waitFor(() => {
      expect(screen.getByText("VIP")).toBeInTheDocument();
    });
    expect(screen.getByRole("cell", { name: "VIP" })).toBeInTheDocument();
  });

  it("affiche les actions groupées après sélection", async () => {
    const user = userEvent.setup();
    const onCreateCampaign = vi.fn();
    render(
      <GroupesFlowHarness
        initialGroups={[makeGroup({ name: "Clients VIP" })]}
        onCreateCampaign={onCreateCampaign}
      />,
    );

    await user.click(screen.getAllByRole("checkbox")[1]);
    expect(
      screen.getByRole("button", { name: "Créer une campagne" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Créer une campagne" }));
    expect(onCreateCampaign).toHaveBeenCalledWith(["group-1"]);
  });

  it("supprime un groupe après confirmation", async () => {
    const user = userEvent.setup();
    render(
      <GroupesFlowHarness
        initialGroups={[makeGroup({ name: "À supprimer" })]}
      />,
    );

    await user.click(screen.getAllByRole("checkbox")[1]);
    await user.click(screen.getByRole("button", { name: "Supprimer (1)" }));

    const confirm = screen.getByRole("alertdialog");
    expect(confirm).toHaveTextContent("Supprimer 1 groupe");
    await user.click(within(confirm).getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(screen.queryByText("À supprimer")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Aucun groupe trouvé")).toBeInTheDocument();
  });
});
