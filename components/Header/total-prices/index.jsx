"use client";

import { currencyInfo, GlobalCurrency } from "@/constants/globalCurrency";
import { useUcodeRequestQuery } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";
import { appStore } from "@/store/app.store";
import { formatDateTime } from "@/utils/formatDate";
import Money from "@/components/shared/Money";
import { formatAmount, formatNumber, formatTotalSumma } from "@/utils/helpers";
import { keepPreviousData } from "@tanstack/react-query";
import { ChevronDown, EllipsisVertical, Maximize2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

// ── Shared sub-components ──────────────────────────────────────────────────────

const AccountDot = ({ color }) => (
  <div
    className={cn(
      "w-2 h-2 rounded-full shrink-0 mt-1.5",
      color === "red" && "bg-red-500",
      color === "green" && "bg-green-500",
      color === "blue" && "bg-blue-500"
    )}
  />
);

const AccountRow = ({ acc }) => (
  <div className="flex items-start justify-between px-2.5 py-[5px] hover:bg-gray-50">
    <div className="flex items-start gap-2.5">
      <AccountDot color={acc?.color} />
      <div className="flex flex-col">
        <span className="text-[13px] font-normal leading-[17px] text-slate-700">
          {acc?.name}
        </span>
        {acc?.status && (
          <span className="text-[10px] text-red-500 font-bold leading-[1.25] mt-0.5">
            {acc?.status}
          </span>
        )}
      </div>
    </div>
    {acc?.balance && (
      <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap ml-4">
        <Money value={acc?.balance} />{" "}
        <span className="text-gray-400 font-normal">
          {acc?.currency}
        </span>
      </span>
    )}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────

const TotalPrice = observer(() => {
  const t = useTranslations("Header.balance");
  const [isBalanceOpen, setIsBalanceOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(["unallocated"]);
  const [activeGroupMenu, setActiveGroupMenu] = useState(null);
  const [modalMode, setModalMode] = useState("compact");
  const [today, setToday] = useState("");
  const [mounted, setMounted] = useState(false);

  const balanceRef = useRef(null);
  const groupMenuRef = useRef(null);

  const { data: myaccounts } = useUcodeRequestQuery({
    method: "get_my_accounts",
    data: {
      groupBy: "legal_entities",
      page: 1,
      limit: 100,
      beznalichnye: true,
      elektronnye: true,
      kartaFizlica: true,
      nalichnye: true,
      active: true,
    },
    querySetting: {
      select: (response) => response?.data,
      placeholderData: keepPreviousData,
    },
  });

  // Счета, закрытые для роли, не показываем и не учитываем в валютах —
  // см. utils/accountPermissions.js
  const accountGroups = useMemo(
    () => appStore.filterAllowedAccountGroups(myaccounts?.data || []),
    [myaccounts],
  );

  useEffect(() => {
    const result = new Map();
    accountGroups
      ?.map((item) => item?.children)
      .flat()
      ?.forEach((item) => {
        result.set(item?.currenies_id, item?.currenies_kod);
      });
    const all = Array.from(result.entries()).map(([, label]) => ({
      value: label,
      label,
    }));
    appStore.setMyCurrencies(all);
    appStore.setCompanyCurrencies(
      Array.from(result.entries()).map(([value, label]) => {
        const title = currencyInfo[label];
        return { value, label: title };
      })
    );
  }, [accountGroups]);

  const Summary = myaccounts?.summary;

  const Compactlist = useMemo(() => {
    return accountGroups
      ?.map((item) =>
        [...item.children]?.map((child) => ({
          name: child?.nazvanie,
          balance: child?.balans_val,
          currency: child?.currenies_kod,
          color: child?.balans_val > 0 ? "green" : "red",
        }))
      )
      .flat();
  }, [accountGroups]);

  useEffect(() => {
    setToday(formatDateTime(new Date()));
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (balanceRef.current && !balanceRef.current.contains(event.target)) {
        setIsBalanceOpen(false);
        setActiveGroupMenu(null);
      }
      if (
        groupMenuRef.current &&
        !groupMenuRef.current.contains(event.target)
      ) {
        setActiveGroupMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isBalanceOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isBalanceOpen]);

  const legalEntitiesData = useMemo(() => {
    return accountGroups?.map((item) => ({
      id: item?.legal_entity_id,
      name: item?.legal_entity_name,
      balance: item?.current_balance,
      total_items: item?.items_count,
      accounts: (item?.children || [])?.map((child) => ({
        id: child?.guid,
        name: child?.nazvanie,
        balance: child?.balans_val,
        currency: child?.currenies_kod,
        color: child?.balans_val > 0 ? "green" : "red",
      })),
    }));
  }, [accountGroups]);

  const totalBalance = useMemo(() => {
    return (
      legalEntitiesData?.reduce((sum, item) => sum + (item.balance || 0), 0) ||
      0
    );
  }, [legalEntitiesData]);

  const viewOptions = [
    { value: "compact", label: t("viewCompact") },
    { value: "full", label: t("viewFull") },
  ];

  const toggleExpandGroup = (id) => {
    setExpandedGroups((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
    setActiveGroupMenu(null);
  };

  // ── View toggle (shared by both modals) ─────────────────────────────────
  const ViewToggle = () => (
    <div className="flex bg-transparent rounded overflow-hidden border border-slate-200 min-w-[150px]">
      {viewOptions.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => setModalMode(opt.value)}
          className={cn(
            "py-[0.325rem] px-2 text-sm font-medium transition-all duration-200 cursor-pointer bg-white",
            i < viewOptions.length - 1 && "border-r border-slate-200",
            modalMode === opt.value
              ? "text-sky-500 relative z-[1]"
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  // ── Modal header (shared) ────────────────────────────────────────────────
  const ModalHeader = ({ title }) => (
    <div className="flex items-start justify-between p-4 relative border-b border-gray-200">
      <div className="flex flex-col items-start">
        <div className="flex items-start gap-2">
          <div className="w-2.5 h-2.5 rounded-full mt-1.5 bg-amber-400 shrink-0" />
          <div className="flex flex-col justify-start">
            {title}
            <p className="text-xs text-gray-400 mt-1 font-normal w-full">
              {today}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ViewToggle />
      </div>
    </div>
  );

  // ── Modal wrapper classes ────────────────────────────────────────────────
  // Compact: dropdown under the trigger (absolute, anchored to wrapper).
  // Full: centered modal overlay (fixed, screen-centered).
  const modalShared =
    "bg-white rounded-xl border border-gray-200 text-slate-800 overflow-visible flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05)] animate-[modalAppear_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]";
  const compactModalClass = cn(
    modalShared,
    "absolute top-full right-0 mt-2 z-[1000] max-h-[calc(100vh-100px)]"
  );
  const fullModalClass = cn(
    modalShared,
    "fixed top-[60px] left-1/2 -translate-x-1/2  z-[1001] max-h-[85vh]"
  );

  return (
    <div ref={balanceRef} className="relative ">
      {/* ── Trigger ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center my-auto relative px-3 h-9 rounded-lg max-w-full min-w-0 overflow-visible transition-colors cursor-pointer hover:bg-slate-100"
        onClick={() => setIsBalanceOpen(!isBalanceOpen)}
      >
        <div className="text-sm font-medium cursor-pointer flex items-center gap-2">
          <div className="flex items-center gap-2">
            <p className="text-slate-500">
              {t("label")}{" "}
              {mounted ? (
                <Money
                  value={Summary?.current_balance}
                  currency={GlobalCurrency?.name}
                  className="font-semibold text-slate-900"
                />
              ) : (
                "0"
              )}
            </p>
          </div>
          <ChevronDown
            size={14}
            className={cn(
              "text-slate-400 transition-all duration-200",
              isBalanceOpen && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* ── Compact modal — dropdown under the trigger ──────────────── */}
      {isBalanceOpen && modalMode === "compact" && (
        <div className={cn(compactModalClass, "w-[400px] p-0")}>
          <div className="flex flex-col relative w-full max-h-[calc(100vh-200px)] overflow-y-auto">
            <ModalHeader
              title={
                <h2 className="text-black text-xl font-semibold">
                  {mounted ? (
                    <Money
                      value={Summary?.current_balance}
                      currency={GlobalCurrency?.name}
                    />
                  ) : (
                    "0"
                  )}
                </h2>
              }
            />
            {/* Account list */}
            <div className="flex flex-col gap-4 min-h-[100px] max-h-[400px] p-4 overflow-y-auto">
              <div className="flex flex-col">
                {Compactlist?.map((acc, idx) => (
                  <AccountRow key={idx} acc={acc} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Full modal — centered with backdrop ─────────────────────── */}
      {isBalanceOpen && modalMode === "full" && (
        <>
          <div className={cn(fullModalClass, "w-[950px]")}>
            <div className="flex flex-col relative w-full max-h-[calc(100vh-200px)] overflow-y-auto">
              <ModalHeader
                title={
                  <h2 className="text-[22px] font-bold text-slate-800 leading-none">
                    {formatAmount(totalBalance)}{" "}
                    {GlobalCurrency?.name}
                  </h2>
                }
              />
              {/* Legal entity grid */}
              <div className="flex flex-col gap-4 min-h-[100px] max-h-[400px] p-4 overflow-y-auto">
                <div className="grid grid-cols-3 gap-5 overflow-visible">
                  {legalEntitiesData?.map((group) => (
                    <div
                      key={group.id}
                      className="flex flex-col gap-2 overflow-visible relative"
                    >
                      {/* Group header row */}
                      <div className="relative overflow-visible">
                        <div className="flex items-center justify-between bg-[#f4f6f8] px-4 py-2.5 rounded">
                          <span className="text-[13px] font-semibold text-slate-700">
                            {group?.name} ({group?.total_items})
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] font-bold">
                              <Money value={group?.balance} />{" "}
                              <span className="text-gray-400 font-normal">
                                {GlobalCurrency?.name}
                              </span>
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveGroupMenu(
                                  activeGroupMenu === group.id ? null : group.id
                                );
                              }}
                              className="transition-colors duration-200 hover:text-slate-600 bg-transparent border-0 cursor-pointer text-[#94a3b8] flex items-center"
                            >
                              <EllipsisVertical size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Group actions dropdown */}
                        {activeGroupMenu === group.id && (
                          <div
                            ref={groupMenuRef}
                            className="absolute right-10 top-[5px] w-40 bg-white rounded shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] border border-gray-100 z-[1100] overflow-visible animate-[fadeInZoomIn_0.15s_ease-out]"
                          >
                            <button
                              onClick={() => toggleExpandGroup(group.id)}
                              className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-slate-700 transition-colors duration-200 hover:bg-gray-50 w-full"
                            >
                              <Maximize2
                                size={16}
                                className="w-4 h-4 text-gray-400 transition-colors duration-200"
                              />
                              <span>
                                {expandedGroups.includes(group.id)
                                  ? t("collapse")
                                  : t("expand")}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expanded accounts */}
                      {expandedGroups?.includes(group.id) &&
                        group?.accounts?.length > 0 && (
                          <div className="flex flex-col">
                            {group?.accounts?.map((acc, idx) => (
                              <AccountRow key={idx} acc={acc} />
                            ))}
                          </div>
                        )}

                      {/* Empty state */}
                      {group?.total_items === 0 && (
                        <div className="flex justify-center mt-4 p-6 text-center">
                          <span className="text-xs text-gray-400">
                            {t("emptyGroup")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default TotalPrice;
