/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import {bills} from "../fixtures/bills.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import "@testing-library/jest-dom";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore)

// Check si l'icone s'affiche sur la gauche est surligner
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', {value: localStorageMock})
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
      expect(windowIcon).toHaveClass("active-icon")
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({data: bills})
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  // Quand je suis sur la page bills alors la page doit s'afficher correctement
  describe("When I navigate to Bills", () => {
    test("Then the page should show properly", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({pathname})
      }
      Object.defineProperty(window, "localStorage", {value: localStorageMock})
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))
      new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({data: bills})
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
    })
  })

  // Quand je clique sur le bouton "Nouvelle note de frais" alors la page "Nouvelle note de frais" s'affiche
  describe("When I click on 'New expense report' btn", () => {
    test("Then the create a new bill form should appear", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({pathname})
      }

      Object.defineProperty(window, "localStorage", {value: localStorageMock})
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))

      const billsInit = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      document.body.innerHTML = BillsUI({data: bills})
      const handleClickNewBill = jest.fn(() => billsInit.handleClickNewBill())
      const btnNewBill = screen.getByTestId("btn-new-bill")
      btnNewBill.addEventListener("click", handleClickNewBill)
      userEvent.click(btnNewBill)
      expect(handleClickNewBill).toHaveBeenCalled()
      await waitFor(() => screen.getByTestId("form-new-bill"))
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })
  })

// Quand je clique sur le bouton oeil, alors la modale doit s'afficher
  describe("When I click on the 'eye' btn of a bill", () => {
    test("Then a modal must appear", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({pathname})
      }
      Object.defineProperty(window, "localStorage", {value: localStorageMock})
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))
      const billsInit = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({data: bills})
      const handleClickIconEye = jest.fn((icon) => billsInit.handleClickIconEye(icon));
      const iconEye = screen.getAllByTestId("icon-eye");
      const modaleFile = document.getElementById("modaleFile")
      $.fn.modal = jest.fn(() => modaleFile.classList.add("show"))
      iconEye.forEach((icon) => {
        icon.addEventListener("click", handleClickIconEye(icon))
        userEvent.click(icon)
        expect(handleClickIconEye).toHaveBeenCalled()
      })
      expect(modaleFile).toHaveClass("show")
    })
  })

   // TEST INTEGRATION - GET 404 - 500
  describe("When an error occurs on getting data with API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          "localStorage",
          { value: localStorageMock }
      )
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee",
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("Then show 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("Then show an 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})