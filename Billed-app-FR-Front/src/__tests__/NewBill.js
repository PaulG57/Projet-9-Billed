/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import store from "../app/Store.js";
import {ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore) // Mock du store pour remplacer l'API

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Simule la page NewBill
    document.body.innerHTML = NewBillUI();

    // Simule un utilisateur connecté en tant qu'employé
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({ type: "Employee", email: "a@a" })
    );
  });

  test("Then handleChangeFile should update fileUrl when a valid file is uploaded", async () => {
    // Création d'une instance de NewBill
    const newBill = new NewBill({
      document,
      onNavigate: jest.fn(),
      store,
      localStorage: window.localStorage,
    });

    // Simule la sélection d'un fichier valide
    const fileInput = screen.getByTestId("file");
    const validFile = new File(["content"], "test.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await new Promise(process.nextTick);
    expect(newBill.fileUrl).toBe("https://localhost:3456/images/test.jpg");
  });

  test("Then handleSubmit should call store update method and navigate", async () => {
    // Mock de navigation
    const onNavigate = jest.fn();

    const newBill = new NewBill({
      document,
      onNavigate,
      store,
      localStorage: window.localStorage,
    });

    // Simule la soumission du formulaire
    const form = screen.getByTestId("form-new-bill");
    fireEvent.submit(form);

    await new Promise(process.nextTick);
    expect(onNavigate).toHaveBeenCalled();
  });
});


// Test d'intégration POST

describe("Given i am connected as Employee", () => {
  test("Then I fill the form and submit, it should create a new bill and navigate to Bills page", async () => {
    const newBill = new NewBill({
      document,
      onNavigate: jest.fn(),
      store: mockStore,
      localStorage: window.localStorage,
    });

    // Simuler le remplissage des champs nécessaires
    fireEvent.change(screen.getByTestId("expense-type"), {
      target: { value: "Transports" },
    });
    fireEvent.change(screen.getByTestId("expense-name"), {
      target: { value: "Train Paris-Lyon" },
    });
    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: "2024-12-16" },
    });
    fireEvent.change(screen.getByTestId("amount"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByTestId("vat"), {
      target: { value: "20" },
    });
    fireEvent.change(screen.getByTestId("pct"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByTestId("commentary"), {
      target: { value: "Déplacement professionnel" },
    });

    // Simuler l'upload de fichier
    const fileInput = screen.getByTestId("file");
    const validFile = new File(["content"], "test.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    // Simuler la soumission du formulaire
    const form = screen.getByTestId("form-new-bill");
    fireEvent.submit(form);

    // Vérifier la navigation vers la page Bills
    await waitFor(() => expect(newBill.onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills));
  });

  describe("When an error occurs on API", () => {
    beforeEach(() => {

      jest.spyOn(mockStore, "bills") // Surveille l'appel à la méthode bills

      // Simule un utilisateur connecté en tant qu'employé
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))

      // Pépare le DOM en simulant la page
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)

      router() // Permet la navigation
    })
    
    test("fetches bills from an API and fails with 404 message error", async () => {

      // Simule une erreur 404
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills) // Navigation vers la page Bills

      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)

      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)

      expect(message).toBeTruthy()
    })
  })

})
