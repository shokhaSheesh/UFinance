import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { authStore } from "./auth.store";

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
  projectActive = false;
  // attendance_active из get_general_settings — модуль давомата (перекличка,
  // руководители групп, причины отсутствия). Включается только у школ/садов
  attendanceActive = false;
  isAiActive = false;
  // plan_total_active из get_general_settings — разрешает править план
  // в колонке «Итого» бюджета (сумма сразу на весь период)
  planTotalActive = false;
  currencies = [];
  myCurrencies = [];
  companyCurrencies = [];
  localApiUrl = "";
  isDonoSchool = false;
  // is_blocked из get_general_settings — компания заблокирована админом,
  // показываем экран с просьбой связаться с администратором
  isBlocked = false;
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
    deals: {
      read: true,
      add: false,
      edit: false,
      delete: false,
      sales: { read: true, add: false, edit: false, delete: false },
      purchases: { read: true, add: false, edit: false, delete: false },
    },
    warehouse: { read: true, add: false, edit: false, delete: false },
    projects: { read: true, add: false, edit: false, delete: false },
    plans: {
      read: true,
      add: false,
      edit: false,
      delete: false,
      cashflow: { read: true, add: false, edit: false, delete: false },
      pnl: { read: true, add: false, edit: false, delete: false },
    },
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
    // Capture the default permission tree before persistence hydration replaces it,
    // so permission fields added after a user's last login can be merged in.
    const defaultPermission = this.permission;
    if (typeof window !== "undefined") {
      makePersistable(this, {
        name: "plan_fact_app",
        properties: [
          "isPayment",
          "currency",
          "isAccrualDate",
          "warehouseActive",
          "returnActive",
          "projectActive",
          "attendanceActive",
          "isAiActive",
          "planTotalActive",
          "currencies",
          "isDonoSchool",
          "myCurrencies",
          "companyCurrencies",
          "localApiUrl",
          {
            // makePersistable has no top-level deserialize hook (it is ignored), so the
            // merge must live on the property itself. Without this, permissions added
            // after a user's last login (e.g. `warehouse`, `deals.sales/purchases`)
            // stay missing from the persisted tree until they log in again.
            key: "permission",
            serialize: (value) => value,
            deserialize: (value) =>
              this.mergePermissions(defaultPermission, value || {}),
          },
          "accuralDateBranch",
        ],
        storage: window.localStorage,
        debugMode: false,
        version: 1,
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

  // Recursively force every add/edit/delete flag to false, preserving `read`.
  // Used to make a branch view-only when its `is_employee` flag is not true.
  stripWriteAccess(node) {
    if (!node || typeof node !== "object") return;
    for (const key in node) {
      if (key === "add" || key === "edit" || key === "delete") {
        node[key] = false;
      } else if (node[key] && typeof node[key] === "object") {
        this.stripWriteAccess(node[key]);
      }
    }
  }

  // View-only unless the active branch marks the user as an employee there.
  isViewOnlyBranch() {
    return !authStore.selectBranch?.is_employee;
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

  setProjectActive(value) {
    this.projectActive = value;
  }

  setAttendanceActive(value) {
    this.attendanceActive = value;
  }

  setAiActive(value) {
    this.isAiActive = value;
  }

  setPlanTotalActive(value) {
    this.planTotalActive = value;
  }

  setisDonoschool(value) {
    this.isDonoSchool = value;
  }

  setIsBlocked(value) {
    this.isBlocked = value;
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
      deals: {
        read: true,
        add: false,
        edit: false,
        delete: false,
        sales: { read: true, add: false, edit: false, delete: false },
        purchases: { read: true, add: false, edit: false, delete: false },
      },
      warehouse: { read: true, add: false, edit: false, delete: false },
      projects: { read: true, add: false, edit: false, delete: false },
      plans: {
        read: true,
        add: false,
        edit: false,
        delete: false,
        cashflow: { read: true, add: false, edit: false, delete: false },
        pnl: { read: true, add: false, edit: false, delete: false },
      },
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
      deals: {
        read: true,
        add: true,
        edit: true,
        delete: true,
        sales: { read: true, add: true, edit: true, delete: true },
        purchases: { read: true, add: true, edit: true, delete: true },
      },
      warehouse: { read: true, add: true, edit: true, delete: true },
      projects: { read: true, add: true, edit: true, delete: true },
      plans: {
        read: true,
        add: true,
        edit: true,
        delete: true,
        cashflow: { read: true, add: true, edit: true, delete: true },
        pnl: { read: true, add: true, edit: true, delete: true },
      },
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
    // A non-employee branch is view-only everywhere — no create/edit/delete.
    if (this.isViewOnlyBranch()) {
      this.stripWriteAccess(this.permission);
    }
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
      deals: {
        read: false,
        add: false,
        edit: false,
        delete: false,
        sales: { read: false, add: false, edit: false, delete: false },
        purchases: { read: false, add: false, edit: false, delete: false },
      },
      warehouse: { read: false, add: false, edit: false, delete: false },
      projects: { read: false, add: false, edit: false, delete: false },
      plans: {
        read: false,
        add: false,
        edit: false,
        delete: false,
        cashflow: { read: false, add: false, edit: false, delete: false },
        pnl: { read: false, add: false, edit: false, delete: false },
      },
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

    // «Планы» (бюджеты) бэкенд добавил позже статического конфига ролей и слаг
    // может отличаться (plans / plan / budgets), а дочерние пункты приходят
    // только с бэка. Поэтому раздел ищем по началу слага, а бюджеты внутри —
    // по слагу и названию. Не распознанный дочерний пункт наследует права
    // самого раздела, чтобы страница не осталась без прав вовсе.
    const isPlansMenu = (slug) => /^(plans?|budgets?)$/i.test(String(slug || ""));
    const matchBudget = (child) => {
      const text = `${child?.menu_slug || ""} ${child?.menu_name || ""}`.toLowerCase();
      if (/cash|денеж|поток|бддс|dds/.test(text)) return "cashflow";
      if (/income|expense|profit|pnl|доход|расход|бдр/.test(text)) return "pnl";
      return null;
    };

    // Process each top-level menu item
    permission.forEach((item) => {
      if (isPlansMenu(item.menu_slug)) {
        const parent = convertPermissions(item);
        newPermission.plans = {
          ...parent,
          cashflow: { ...parent },
          pnl: { ...parent },
        };
        item.children?.forEach((child) => {
          const key = matchBudget(child);
          if (key) newPermission.plans[key] = convertPermissions(child);
        });
        return;
      }

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
          newPermission.deals.read = item.read || false;
          newPermission.deals.add = item.write || false;
          newPermission.deals.edit = item.update || false;
          newPermission.deals.delete = item.delete || false;
          item.children?.forEach((child) => {
            switch (child.menu_slug) {
              case "shipment":
                newPermission.deals.sales = convertPermissions(child);
                break;
              case "supply":
                newPermission.deals.purchases = convertPermissions(child);
                break;
            }
          });
          break;

        case "warehouse":
          newPermission.warehouse = convertPermissions(item);
          break;

        case "project":
        case "projects":
          newPermission.projects = convertPermissions(item);
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

    // A non-employee branch is view-only everywhere — no create/edit/delete,
    // regardless of what the role grants.
    if (this.isViewOnlyBranch()) {
      this.stripWriteAccess(newPermission);
    }

    this.permission = newPermission;
  }

  // Restore state from localStorage/cookies on init
}

export const appStore = new AppStore();
