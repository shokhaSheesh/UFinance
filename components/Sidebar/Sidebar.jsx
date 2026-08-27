"use client";

import { AppLogo, DealIcon, UsersIcon } from "@/constants/icons";
import { cn } from "@/lib/utils";
import { appStore } from "@/store/app.store";
import { authStore } from "@/store/auth.store";
import {
  Briefcase,
  CalendarCheck,
  ChartLine,
  ClipboardList,
  Library,
  RefreshCw,
  Warehouse,
} from "lucide-react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoSettingsOutline } from "react-icons/io5";

// Тестовые отчёты (*_by_query) показываем только этой компании
const BY_QUERY_TEST_COMPANY_ID = "212f6816-b0ef-42de-802b-c9738f0e8cd1";

export const Sidebar = observer(() => {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const sidebarRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState(appStore.localApiUrl || "");
  const [mounted, setMounted] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0 });
  const lastToggleRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        openSubmenu &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        setOpenSubmenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openSubmenu]);

  // Close submenu on route change
  useEffect(() => {
    setOpenSubmenu(null);
  }, [pathname]);

  const toggleSubmenu = (e, submenuKey, isSubmenuOpen) => {
    const now = Date.now();
    if (now - lastToggleRef.current < 500) return;
    lastToggleRef.current = now;
    if (isSubmenuOpen) {
      setOpenSubmenu(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setSubmenuPosition({ top: rect.top });
      setOpenSubmenu(submenuKey);
    }
  };

  const handleSaveApiUrl = () => {
    if (apiUrl.trim()) {
      appStore.setLocalApiUrl(apiUrl.trim());
      setModalOpen(false);
    }
  };

  const hasSavedUrl = !!appStore.localApiUrl;

  const handleClearApiUrl = () => {
    appStore.setLocalApiUrl("");
    setApiUrl("");
  };

  const permissions = toJS(appStore.permission);

  const navItems = [
    {
      icon: ChartLine,
      label: t("nav.indicators"),
      href: "/indicators",
      hasPage: true,
      canShow: permissions?.indicators?.read,
    },
    {
      icon: RefreshCw,
      label: t("nav.operations"),
      href: "/operations",
      hasPage: true,
      canShow:
        permissions?.operations?.income?.read ||
        permissions?.operations?.payout?.read ||
        permissions?.operations?.transfer?.read ||
        permissions?.operations?.accrual?.read ||
        permissions?.operations?.shipment?.read,
    },
    {
      icon: UsersIcon,
      label: t("nav.counterparties"),
      href: "/directories/counterparties",
      hasPage: true,
      canShow: permissions?.directories?.counterparties?.read,
    },
    {
      icon: DealIcon,
      label: t("nav.deals"),
      href: "/deals",
      hasPage: true,
      canShow:
        permissions?.deals?.read ||
        permissions?.deals?.sales?.read ||
        permissions?.deals?.purchases?.read,
      submenu: [
        {
          label: t("nav.dealsSelling"),
          description: t("nav.dealsSellingDesc"),
          href: "/deals/selling",
          hasPage: true,
          canShow: permissions?.deals?.sales?.read,
        },
        {
          label: t("nav.dealsPurchase"),
          description: t("nav.dealsPurchaseDesc"),
          href: "/deals/purchase",
          hasPage: true,
          canShow: permissions?.deals?.purchases?.read,
        },
      ],
    },
    {
      icon: CalendarCheck,
      label: t("nav.plans"),
      href: "",
      hasPage: true,
      canShow:
        permissions?.plans?.read ||
        permissions?.plans?.pnl?.read ||
        permissions?.plans?.cashflow?.read,
      submenu: [
        // {
        //   label: t("plans.payment_calendar"),
        //   href: "/payment_calendar",
        //   hasPage: true,
        //   canShow: true,
        // },
        {
          label: t("plans.income_expense_budget"),
          description: t("plans.income_expense_budget_desc"),
          href: "/income_expense_budget",
          hasPage: true,
          canShow: permissions?.plans?.pnl?.read,
        },
        {
          label: t("plans.cash_flow_budget"),
          description: t("plans.cash_flow_budget_desc"),
          href: "/cash_flow_budget",
          hasPage: true,
          canShow: permissions?.plans?.cashflow?.read,
        },
      ],
    },
    {
      icon: Briefcase,
      label: t("nav.projects"),
      href: "/projects",
      hasPage: true,
      canShow: appStore.projectActive && permissions?.projects?.read,
    },
    {
      icon: ClipboardList,
      label: t("nav.reports"),
      href: "/reports",
      hasPage: true,
      canShow:
        permissions?.reports?.cashflow?.read ||
        permissions?.reports?.pnl?.read ||
        permissions?.reports?.balance?.read,
      submenu: [
        {
          label: t("reports.cashflow"),
          href: "/reports/cashflow",
          hasPage: true,
          canShow: permissions?.reports?.cashflow?.read,
        },
        {
          label: t("reports.cashflowByQuery"),
          href: "/reports/cashflow-by-query",
          hasPage: true,
          canShow:
            permissions?.reports?.cashflow?.read &&
            authStore.userData?.company_id === BY_QUERY_TEST_COMPANY_ID,
        },
        {
          label: t("reports.pnl"),
          href: "/reports/profit-and-loss",
          hasPage: true,
          canShow: permissions?.reports?.pnl?.read,
        },
        {
          label: t("reports.balance"),
          href: "/reports/balance",
          hasPage: true,
          canShow: permissions?.reports?.balance?.read,
        },
        {
          label: t("reports.balanceByQuery"),
          href: "/reports/balance-by-query",
          hasPage: true,
          canShow:
            permissions?.reports?.balance?.read &&
            authStore.userData?.company_id === BY_QUERY_TEST_COMPANY_ID,
        },
        {
          label: t("reports.students"),
          href: "/reports/students",
          hasPage: true,
          canShow: appStore.isDonoSchool,
        },
      ],
    },
    {
      icon: Library,
      label: t("nav.directories"),
      href: "/directories",
      hasPage: true,
      canShow:
        permissions?.directories?.counterparties?.read ||
        permissions?.directories?.transactionCategories?.read ||
        permissions?.directories?.accounts?.read ||
        permissions?.directories?.legalentities?.read ||
        permissions?.directories?.productsServices?.read,
      submenu: [
        {
          label: t("directories.counterparties"),
          href: "/directories/counterparties",
          hasPage: true,
          canShow: permissions?.directories?.counterparties?.read,
        },
        {
          // студенты — те же контрагенты, право доступа общее;
          // справочник только для школ (isDonoSchool)
          label: t("directories.students"),
          href: "/directories/students",
          hasPage: true,
          canShow:
            appStore.isDonoSchool && permissions?.directories?.counterparties?.read,
        },
        {
          label: t("directories.transactionCategories"),
          href: "/directories/transaction-categories",
          hasPage: true,
          canShow: permissions?.directories?.transactionCategories?.read,
        },
        {
          label: t("directories.accounts"),
          href: "/directories/accounts",
          hasPage: true,
          canShow: permissions?.directories?.accounts?.read,
        },
        {
          label: t("directories.legalEntities"),
          href: "/directories/legal-entities",
          hasPage: true,
          canShow: permissions?.directories?.legalentities?.read,
        },
        {
          label: t("directories.productsServices"),
          href: "/directories/product-service",
          hasPage: true,
          canShow: permissions?.directories?.productsServices?.read,
        },
        {
          // живёт вместе с модулем давомата: attendance_active из настроек
          label: t("directories.attendance"),
          href: "/directories/attendance",
          hasPage: true,
          canShow: appStore.isDonoSchool && appStore.attendanceActive,
        },
      ],
    },
    {
      icon: Warehouse,
      label: t("nav.warehouse"),
      href: "/warehouse",
      hasPage: true,
      canShow: appStore.warehouseActive && permissions?.warehouse?.read,
    },
    {
      icon: IoSettingsOutline,
      label: t("nav.settings"),
      href: "/settings",
      hasPage: true,
      canShow:
        permissions?.settings?.general?.read ||
        permissions?.settings?.users?.read ||
        permissions?.settings?.profile?.read ||
        permissions?.settings?.exchangerates?.read,
    },
  ];

  if (!mounted) {
    return (
      <aside className="bg-blue-950 w-[80px] flex flex-col gap-2 h-screen  items-center justify-start fixed left-0">
        <nav className="flex flex-col w-full">
          <div className="mt-2 mx-auto ml-5 mb-4 w-11 h-11" />
        </nav>
      </aside>
    );
  }

  return (
    <aside
      className="bg-blue-950 w-[80px] flex flex-col gap-2  h-screen items-center justify-star  left-0 "
      ref={sidebarRef}
    >
      <nav className="flex flex-col   w-full">
        <AppLogo
          size={44}
          strokeWidth={1.5}
          className="mt-2 mx-auto ml-5 mb-4"
        />
        {navItems
          .filter((item) => item.hasPage && item.canShow)
          .map((item, index) => {
            const isActive =
              pathname === item.href ||
              (item.href &&
                item.href !== "/" &&
                pathname.startsWith(item.href));
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuActive =
              hasSubmenu && item.submenu.some((sub) => pathname === sub.href);

            const LinkContent = (
              <div
                className={cn(
                  "flex flex-col h-[65px] items-center justify-center w-full transition-all cursor-pointer hover:bg-slate-900/50 text-white/60 hover:text-white ",
                  (isActive || isSubmenuActive) && " text-white"
                )}
              >
                <div className="mb-1">
                  <item.icon size={22} strokeWidth={1.5} />
                </div>
                <span className="text-mini text-center font-medium leading-tight">
                  {item.label}
                </span>
              </div>
            );

            if (hasSubmenu) {
              const submenuKey = `submenu-${index}`;
              const isSubmenuOpen = openSubmenu === submenuKey;
              return (
                <div key={index} className="relative">
                  <a
                    href="#"
                    className="relative cursor-pointer w-full"
                    style={{ touchAction: "manipulation" }}
                    onTouchEnd={(e) => {
                      toggleSubmenu(e, submenuKey, isSubmenuOpen);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSubmenu(e, submenuKey, isSubmenuOpen);
                    }}
                  >
                    {LinkContent}
                  </a>
                  {isSubmenuOpen && (
                    <div
                      className="fixed left-[80px] z-[9999] block w-[200px] shadow-lg rounded-tr-lg rounded-br-lg p-2"
                      style={{
                        top: submenuPosition.top,
                        backgroundColor: "#162456",
                        color: "white",
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        {(item.submenu || [])
                          .filter((sub) => sub.hasPage && sub.canShow !== false)
                          .map((sub, subIndex) => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={subIndex}
                                href={sub.href}
                                className={cn(
                                  "block p-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors",
                                  isSubActive && "bg-white/20 text-white"
                                )}
                              >
                                <span className="font-medium">{sub.label}</span>
                                {sub.description && (
                                  <span className="block text-[10px] text-white/40 mt-0.5 leading-tight">
                                    {sub.description}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link className="w-full" key={index} href={item.href || "/"}>
                {LinkContent}
              </Link>
            );
          })}
      </nav>

      {/* Invisible clickable button at bottom - opens modal when clicked */}
      <button
        onClick={() => setModalOpen(true)}
        className="mt-auto w-full h-12 opacity-0 cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal for setting local API URL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-[500px] max-w-[95vw]">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              API URL sozlamalari
            </h2>

            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-sm font-medium text-slate-500">
                API URL
              </label>
              <textarea
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                disabled={hasSavedUrl}
                placeholder="API URL manzilini kiriting..."
                className={cn(
                  "w-full p-3 border border-gray-300 rounded-lg text-sm resize-none",
                  hasSavedUrl && "bg-gray-100 cursor-not-allowed"
                )}
                rows={4}
              />
              {hasSavedUrl && (
                <p className="text-xs text-gray-500">URL saqlandi</p>
              )}
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 bg-white text-slate-500 border border-gray-300 rounded-lg text-sm font-medium hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              {apiUrl && (
                <button
                  onClick={handleClearApiUrl}
                  className="px-5 py-2 bg-white text-slate-500 border border-gray-300 rounded-lg text-sm font-medium hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Tozalash
                </button>
              )}
              {!hasSavedUrl && (
                <button
                  onClick={handleSaveApiUrl}
                  disabled={!apiUrl.trim()}
                  className="px-5 py-2 bg-[#0E73F6] text-white rounded-lg text-sm font-semibold hover:bg-[#0b5fd4] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  Saqlash
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
});
