/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store.js"

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    
    test("Then handleClickNewBill should navigate to NewBill page", () => {
      const onNavigate = jest.fn(); // Mock de la fonction de navigation
      const billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
    
      // Simuler l'élément bouton et déclencher le clic
      const newBillButton = document.createElement("button");
      newBillButton.dataset.testid = "btn-new-bill";
      newBillButton.addEventListener("click", billsInstance.handleClickNewBill);
      document.body.appendChild(newBillButton);
    
      // Simuler le clic
      newBillButton.click();
    
      // Vérifier que onNavigate a été appelé avec le bon chemin
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
    });
    test("Then it should format the bills correctly", async () => {
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: {
          bills: () => ({
            list: jest.fn().mockResolvedValue([
              { id: "1", date: "2024-12-04", status: "pending" },
              { id: "2", date: "not-a-date", status: "accepted" },
            ]),
          }),
        },
        localStorage: window.localStorage,
      });

      const bills = await billsInstance.getBills();

      expect(bills[0].date).toBe("4 Déc. 24"); 
      expect(bills[0].status).toBe("En attente"); 
      expect(bills[1].date).toBe("not-a-date");
      expect(bills[1].status).toBe("Accepté");
    });
    
  })
})

//Test integration GET bills
describe("Given I am connected as an employee", () => {
  describe("When I navigate to Bills Page", () => {

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills"); // Surveiller l'appel à la méthode bills
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });

        // Navigation vers Bills Page
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
        window.onNavigate(ROUTES_PATH.Bills);

        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        // Navigation vers Bills Page
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
        window.onNavigate(ROUTES_PATH.Bills);

        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});