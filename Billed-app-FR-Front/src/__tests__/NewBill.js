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

// Mock du store pour remplacer l'API
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Simule la page NewBill
    document.body.innerHTML = NewBillUI();

    // Simule un utilisateur connecté en tant qu'employé dans le localStorage
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

describe("When an error occurs on API", () => {
    beforeEach(() => {

      // Mock de la fonction bills
      jest.spyOn(mockStore, "bills")

      // Simule un utilisateur connecté en tant qu'employé dans le localStorage
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))

      // Pépare le DOM en simulant le router
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      // Simule une erreur 404
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})

      // Navigue vers la page bills
      window.onNavigate(ROUTES_PATH.Bills)

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