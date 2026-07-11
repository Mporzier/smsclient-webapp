import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactsFlowHarness } from "./harness/ContactsFlowHarness";
import { makeContact, resetMockIds } from "./helpers/mockData";

describe("Contacts — flows (intégration, mocks)", () => {
  beforeEach(() => {
    resetMockIds();
  });

  it("affiche l'état vide et les actions principales", () => {
    render(<ContactsFlowHarness />);

    expect(
      screen.getByText("Aucun contact pour l'instant"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Importer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ajouter un contact" }),
    ).toBeInTheDocument();
  });

  it("affiche la liste des contacts mockés", () => {
    render(
      <ContactsFlowHarness
        initialRows={[
          makeContact({ firstName: "Bob", lastName: "Durand" }),
          makeContact({
            id: "contact-2",
            firstName: "Chloé",
            lastName: "Bernard",
            phone: "06 98 76 54 32",
          }),
        ]}
      />,
    );

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Chloé")).toBeInTheDocument();
    expect(screen.getByText("2 contacts")).toBeInTheDocument();
  });

  it("crée un contact via la modale", async () => {
    const user = userEvent.setup();
    render(<ContactsFlowHarness />);

    await user.click(screen.getByRole("button", { name: "Ajouter un contact" }));
    expect(
      screen.getByRole("dialog", { name: "Ajouter un contact" }),
    ).toBeInTheDocument();

    const dialog = screen.getByRole("dialog", { name: "Ajouter un contact" });
    const inputs = within(dialog).getAllByRole("textbox");
    await user.type(inputs[0], "Jean");
    await user.type(inputs[1], "Dupont");
    await user.type(screen.getByLabelText(/Téléphone/i), "0611223344");

    await user.click(screen.getByRole("button", { name: "Enregistrer le contact" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Jean")).toBeInTheDocument();
    expect(screen.getByText("Dupont")).toBeInTheDocument();
    expect(screen.getByText("1 contact")).toBeInTheDocument();
  });

  it("filtre les contacts via la recherche", async () => {
    const user = userEvent.setup();
    render(
      <ContactsFlowHarness
        initialRows={[
          makeContact({ firstName: "Alice", lastName: "Martin" }),
          makeContact({
            id: "contact-2",
            firstName: "Bob",
            lastName: "Durand",
          }),
        ]}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Rechercher un contact…"),
      "Bob",
    );

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("modifie un contact depuis la liste", async () => {
    const user = userEvent.setup();
    render(
      <ContactsFlowHarness
        initialRows={[makeContact({ firstName: "Alice", lastName: "Martin" })]}
      />,
    );

    await user.click(screen.getByText("Alice"));
    const dialog = screen.getByRole("dialog", { name: "Modifier le contact" });
    const firstNameInput = within(dialog).getAllByRole("textbox")[0];
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Alicia");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Alicia")).toBeInTheDocument();
  });

  it("affiche les actions groupées après sélection", async () => {
    const user = userEvent.setup();
    const onCreateCampaign = vi.fn();
    render(
      <ContactsFlowHarness
        initialRows={[makeContact({ firstName: "Alice" })]}
        onCreateCampaign={onCreateCampaign}
      />,
    );

    await user.click(screen.getAllByRole("checkbox")[1]);
    expect(
      screen.getByRole("button", { name: "Créer une campagne" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Supprimer (1)" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Créer une campagne" }));
    expect(onCreateCampaign).toHaveBeenCalledWith(["contact-1"]);
  });

  it("supprime un contact sélectionné après confirmation", async () => {
    const user = userEvent.setup();
    render(
      <ContactsFlowHarness
        initialRows={[makeContact({ firstName: "Alice" })]}
      />,
    );

    await user.click(screen.getAllByRole("checkbox")[1]);
    await user.click(screen.getByRole("button", { name: "Supprimer (1)" }));

    const confirm = screen.getByRole("alertdialog");
    expect(confirm).toHaveTextContent("Supprimer 1 contact");
    await user.click(within(confirm).getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    });
    expect(
      screen.getByText("Aucun contact pour l'instant"),
    ).toBeInTheDocument();
  });
});
