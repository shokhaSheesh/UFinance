import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";

class AppStore {
  isPayment = false;
  isAccrualDate = false;
  accuralDateBranch = [];
  currency = {
    name: "",
    guid: "",
    code: "",
  };
  isWLCMPayment = false;
  warehouseActive = false;
  returnActive = false;
  isAiActive = false;
  currencies = [];
  myCurrencies = [];
  companyCurrencies = [];
  localApiUrl = "";
  isDonoSchool = false;
  permission = {
    indicators: { read: true },
    operations: {
      income: { read: true, add: false, edit: false, delete: false },
      payout: { read: true, add: false, edit: false, delete: false },
      transfer: { read: true, add: false, edit: false, delete: false },
      accrual: { read: true, add: false, edit: false, delete: false },
      shipment: { read: true, add: false, edit: false, delete: false },
      supply: { read: true, add: false, edit: false, delete: false },
    },
    deals: { read: true, add: false, edit: false, delete: false },
    reports: {
      cashflow: { read: true },
      pnl: { read: true },
      balance: { read: true },
    },
    directories: {
      counterparties: { read: true, add: false, edit: false, delete: false },
      transactionCategories: {
        read: true,
        add: false,
        edit: false,
        delete: false,
      },
      accounts: { read: true, add: false, edit: false, delete: false },
      legalentities: { read: true, add: false, edit: false, delete: false },
      productsServices: { read: true, add: false, edit: false, delete: false },
    },
    settings: {
      general: { read: true, add: false, edit: false, delete: false },
      users: { read: true, add: false, edit: false, delete: false },
      profile: { read: true, add: false, edit: false, delete: false },
      branches: { read: true, add: false, edit: false, delete: false },
      exchangerates: { read: true, add: false, edit: false, delete: false },
    },
  };

  constructor() {
    makeAutoObservable(this);
    if (typeof window !== "undefined") {
      makePersistable(this, {
        name: "plan_fact_app",
        properties: [
          "isPayment",
          "currency",
          "isAccrualDate",
          "warehouseActive",
          "returnActive",
          "isAiActive",
          "currencies",
          "isDonoSchool",
          "myCurrencies",
          "companyCurrencies",
          "localApiUrl",
          "permission",
          "accuralDateBranch",
        ],
        storage: window.localStorage,
        debugMode: true,
        version: 1,
        deserialize: (storedValue, defaultValue) => {
          // Merge persisted permission with defaults to handle new fields
          if (storedValue?.permission && defaultValue?.permission) {
            storedValue.permission = this.mergePermissions(
              defaultValue.permission,
              storedValue.permission
            );
          }
          return { ...defaultValue, ...storedValue };
        },
      });
    }
  }

  mergePermissions(defaults, stored) {
    const result = {};
    for (const key in defaults) {
      if (typeof defaults[key] === "object" && !Array.isArray(defaults[key])) {
        result[key] = this.mergePermissions(defaults[key], stored?.[key] || {});
      } else {
        result[key] = stored?.[key] ?? defaults[key];
      }
    }
    return result;
  }

  setWLCMPayment(value) {
    this.isWLCMPayment = value;
  }

  setWarehouseActive(value) {
    this.warehouseActive = value;
  }

  setReturnActive(value) {
    this.returnActive = value;
  }

  setAiActive(value) {
    this.isAiActive = value;
  }

  setisDonoschool(value) {
    this.isDonoSchool = value;
  }

  setIsPayment(value) {
    this.isPayment = value;
  }

  setCurrency(value) {
    this.currency = value;
  }

  setCurrencies(value) {
    this.currencies = value;
  }

  setCompanyCurrencies(value) {
    this.companyCurrencies = value;
  }

  setMyCurrencies(value) {
    this.myCurrencies = value;
  }

  setLocalApiUrl(value) {
    this.localApiUrl = value;
  }

  setPermission(value) {
    this.permission = value;
  }

  setIsAccrualDate(value) {
    this.isAccrualDate = value;
    // if (this.accuralDateBranch?.includes(id)) {
    // 	this.isAccrualDate = value
    // } else {
    // 	this.isAccrualDate = false
    // }
  }

  setBranchIsAccrualDate(value) {
    if (this.accuralDateBranch?.includes(value)) {
      this.isAccrualDate = true;
    } else {
      this.isAccrualDate = false;
    }
  }

  setAccuralDateBranch(value) {
    if (this.accuralDateBranch?.includes(value)) {
      this.accuralDateBranch = this.accuralDateBranch.filter(
        (branch) => branch !== value
      );
    } else {
      this.accuralDateBranch.push(value);
    }
  }

  setPlanfactPermission() {
    this.permission = {
      indicators: { read: true },
      operations: {
        income: { read: true, add: false, edit: false, delete: false },
        payout: { read: true, add: false, edit: false, delete: false },
        transfer: { read: true, add: false, edit: false, delete: false },
        accrual: { read: true, add: false, edit: false, delete: false },
        shipment: { read: true, add: false, edit: false, delete: false },
        supply: { read: true, add: false, edit: false, delete: false },
      },
      deals: { read: true, add: false, edit: false, delete: false },
      reports: {
        cashflow: { read: true },
        pnl: { read: true },
        balance: { read: true },
      },
      directories: {
        counterparties: { read: true, add: false, edit: false, delete: false },
        transactionCategories: {
          read: true,
          add: false,
          edit: false,
          delete: false,
        },
        accounts: { read: true, add: false, edit: false, delete: false },
        legalentities: { read: true, add: false, edit: false, delete: false },
        productsServices: {
          read: true,
          add: false,
          edit: false,
          delete: false,
        },
      },
      settings: {
        general: { read: true, add: false, edit: false, delete: false },
        users: { read: true, add: false, edit: false, delete: false },
        profile: { read: true, add: false, edit: false, delete: false },
        branches: { read: true, add: false, edit: false, delete: false },
        exchangerates: { read: true, add: false, edit: false, delete: false },
      },
    };
  }

  setEmployerPermission() {
    this.permission = {
      indicators: { read: true },
      operations: {
        income: { read: true, add: true, edit: true, delete: true },
        payout: { read: true, add: true, edit: true, delete: true },
        transfer: { read: true, add: true, edit: true, delete: true },
        accrual: { read: true, add: true, edit: true, delete: true },
        shipment: { read: true, add: true, edit: true, delete: true },
        supply: { read: true, add: true, edit: true, delete: true },
      },
      deals: { read: true, add: true, edit: true, delete: true },
      reports: {
        cashflow: { read: true },
        pnl: { read: true },
        balance: { read: true },
      },
      directories: {
        counterparties: { read: true, add: true, edit: true, delete: true },
        transactionCategories: {
          read: true,
          add: true,
          edit: true,
          delete: true,
        },
        accounts: { read: true, add: true, edit: true, delete: true },
        legalentities: { read: true, add: true, edit: true, delete: true },
        productsServices: { read: true, add: true, edit: true, delete: true },
      },
      settings: {
        general: { read: true, add: true, edit: true, delete: true },
        users: { read: true, add: true, edit: true, delete: true },
        profile: { read: true, add: true, edit: true, delete: true },
        branches: { read: true, add: true, edit: true, delete: true },
        exchangerates: { read: true, add: true, edit: true, delete: true },
      },
    };
  }

  setNewPermission(permission) {
    if (!permission || !Array.isArray(permission)) {
      return;
    }

    // Helper to convert API permissions to app format
    const convertPermissions = (item) => ({
      read: item.read || false,
      add: item.write || false,
      edit: item.update || false,
      delete: item.delete || false,
    });

    // Helper to find child by slug
    // const findChild = (children, slug) => children?.find(c => c.menu_slug === slug)

    // Build new permission object
    const newPermission = {
      indicators: { read: false },
      operations: {
        income: { read: false, add: false, edit: false, delete: false },
        payout: { read: false, add: false, edit: false, delete: false },
        transfer: { read: false, add: false, edit: false, delete: false },
        accrual: { read: false, add: false, edit: false, delete: false },
        shipment: { read: false, add: false, edit: false, delete: false },
        supply: { read: true, add: false, edit: false, delete: false },
      },
      deals: { read: false, add: false, edit: false, delete: false },
      reports: {
        cashflow: { read: false },
        pnl: { read: false },
        balance: { read: false },
      },
      directories: {
        counterparties: { read: false, add: false, edit: false, delete: false },
        transactionCategories: {
          read: false,
          add: false,
          edit: false,
          delete: false,
        },
        accounts: { read: false, add: false, edit: false, delete: false },
        legalentities: { read: false, add: false, edit: false, delete: false },
        productsServices: {
          read: false,
          add: false,
          edit: false,
          delete: false,
        },
      },
      settings: {
        general: { read: false, add: false, edit: false, delete: false },
        users: { read: false, add: false, edit: false, delete: false },
        profile: { read: false, add: false, edit: false, delete: false },
        branches: { read: false, add: false, edit: false, delete: false },
        exchangerates: { read: false, add: false, edit: false, delete: false },
      },
    };

    // Process each top-level menu item
    permission.forEach((item) => {
      switch (item.menu_slug) {
        case "indicators":
          newPermission.indicators.read = item.read || false;
          break;

        case "operations":
          item.children?.forEach((child) => {
            switch (child.menu_slug) {
              case "income":
                newPermission.operations.income = convertPermissions(child);
                break;
              case "expense":
                newPermission.operations.payout = convertPermissions(child);
                break;
              case "transfer":
                newPermission.operations.transfer = convertPermissions(child);
                break;
              case "accrual":
                newPermission.operations.accrual = convertPermissions(child);
                break;
              case "shipment":
                newPermission.operations.shipment = convertPermissions(child);
                break;
              case "supply":
                newPermission.operations.supply = convertPermissions(child);
                break;
            }
          });
          break;

        case "deals":
          newPermission.deals = convertPermissions(item);
          break;

        case "reports":
          item.children?.forEach((child) => {
            switch (child.menu_slug) {
              case "cash_flow":
                newPermission.reports.cashflow.read = child.read || false;
                break;
              case "p_and_l":
                newPermission.reports.pnl.read = child.read || false;
                break;
              case "balance":
                newPermission.reports.balance.read = child.read || false;
                break;
            }
          });
          break;

        case "directories":
          item.children?.forEach((child) => {
            switch (child.menu_slug) {
              case "counterparties":
                newPermission.directories.counterparties =
                  convertPermissions(child);
                break;
              case "accounting_items":
                newPermission.directories.transactionCategories =
                  convertPermissions(child);
                break;
              case "my_accounts":
                newPermission.directories.accounts = convertPermissions(child);
                break;
              case "my_entities":
                newPermission.directories.legalentities =
                  convertPermissions(child);
                break;
              case "products_and_services":
                newPermission.directories.productsServices =
                  convertPermissions(child);
                break;
            }
          });
          break;

        case "settings":
          item.children?.forEach((child) => {
            switch (child.menu_slug) {
              case "general_settings":
                newPermission.settings.general = convertPermissions(child);
                break;
              case "users":
                newPermission.settings.users = convertPermissions(child);
                break;
              case "my_profile":
                newPermission.settings.profile = convertPermissions(child);
                break;
              case "branches":
                newPermission.settings.branches = convertPermissions(child);
                break;
              case "exchange_rates":
                newPermission.settings.exchangerates =
                  convertPermissions(child);
                break;
            }
          });
          break;
      }
    });

    this.permission = newPermission;
  }

  // Restore state from localStorage/cookies on init
}

export const appStore = new AppStore();
