import { OperationMenu } from "@/components/operations/OperationsTable/OperationMenu";
import PriceStatus from "@/components/operations/PriceStatus";
import {
  ExpendClose,
  ExpendOpen,
} from "@/constants/icons";
import { useChartOfAccountsCategories } from "@/hooks/useChartOfAccountsCategories";
import { cn } from "@/lib/utils";
import { appStore } from "@/store/app.store";
import { operationFilterStore } from "@/store/operationFilter.store";
import { CornerDownRight } from "lucide-react";
import OperationTypeIcon from "@/components/operations/OperationTypeIcon/OperationTypeIcon";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { memo, useMemo, useState } from "react";
import styles from "./style.module.scss";

const TableRow = observer(
  ({
    op,
    handleEditOperation,
    handleDeleteOperation,
    handleCopyOperation,
    counterpartyGuid,
    showIndex,
  }) => {
    const t = useTranslations("Operations");
    const [open, setOpen] = useState(false);
    // Интерфейсные настройки из «Общих настроек» (get_general_settings)
    const { showArticleCategoryInList, showPaymentOrderNumber } =
      appStore.interfaceSettings || {};
    const categoryByAccountId = useChartOfAccountsCategories();
    // «Нераспределенный расход [Расходы]» — категория берётся из корня
    // плана счетов и дописывается к названию статьи, как в ПланФакте
    const withCategory = (name, accountId) => {
      if (!showArticleCategoryInList || !name) return name;
      const category = categoryByAccountId.get(accountId);
      return category ? `${name} [${category}]` : name;
    };
    const children = useMemo(() => new Set(), []);
    const chartofaccounts = useMemo(() => new Set(), []);
    // const deals = useMemo(() => new Set(), [])
    const isSpinasiya =
      !operationFilterStore?.selectedFilters?.includes("Списание");
    const isZachisleniya =
      !operationFilterStore?.selectedFilters?.includes("Зачисление");
    const isDebit = !operationFilterStore?.selectedFilters?.includes("Дебет");
    const isCredit = !operationFilterStore?.selectedFilters?.includes("Кредит");

    const operationPermissions = appStore.permission.operations;
    const canEdit =
      (operationPermissions.income.edit && op.operationType === "income") ||
      (operationPermissions.payout.edit && op.operationType === "payment") ||
      (operationPermissions.transfer.edit && op.operationType === "transfer") ||
      (operationPermissions.accrual.edit && op.operationType === "accrual") ||
      (operationPermissions.shipment.edit &&
        (op.operationType === "shipment" || op.operationType === "supply"));

    const projects = useMemo(() => new Set(), []);

    op.operationParts?.forEach((part) => {
      children.add(part?.counterparties_id);
      chartofaccounts.add(part?.chart_of_accounts_id);
      if (part?.projects_id) projects.add(part.projects_id);
    });

    const titleContragent = useMemo(() => {
      if (op.tip == "Начисление")
        return op.counterparty || t("row.accrualPlaceholder");
      if (children.size === 1 && children.has(counterpartyGuid)) {
        return op.counterparty || "";
      } else if (children.size > 1) {
        return t("row.counterpartiesCount", { count: children.size || 2 });
      } else {
        return op.counterparty || "";
      }
    }, [children, counterpartyGuid, op.counterparty, op.tip, t]);

    const titleChartOfAccounts = useMemo(() => {
      if (chartofaccounts.size > 1) {
        return t("row.statyaCount", { count: chartofaccounts.size || 2 });
      }
      return withCategory(op.chartOfAccounts || "", op.chart_of_accounts_id);
      // withCategory зависит только от настройки и карты категорий
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      chartofaccounts,
      op.chartOfAccounts,
      op.chart_of_accounts_id,
      showArticleCategoryInList,
      categoryByAccountId,
      t,
    ]);

    // Серая строка под статьёй: номер платёжного поручения (если включён
    // в настройках и пришёл с бэка) и назначение платежа
    const articleSubtitle = useMemo(() => {
      const parts = [];
      if (showPaymentOrderNumber && op.paymentOrderNumber) {
        parts.push(`№ ${op.paymentOrderNumber}`);
      }
      if (op.opisanie) parts.push(op.opisanie);
      return parts.join(" · ");
    }, [showPaymentOrderNumber, op.paymentOrderNumber, op.opisanie]);

    // Проект разбит по строкам: один на все части — показываем его,
    // несколько — счётчик, как у контрагентов и статей
    const titleProject = useMemo(() => {
      if (projects.size === 1) {
        return (
          op.operationParts?.find((part) => part?.projects_id)?.projectName ||
          op.projectName ||
          ""
        );
      } else if (projects.size > 1) {
        return t("row.projectsCount", { count: projects.size });
      }
      return op.projectName || "";
    }, [projects, op.operationParts, op.projectName, t]);

    const titleDeals = useMemo(() => {
      if (
        op.tip == "Начисление" &&
        op.sales_transaction_name &&
        op.sales_transaction_name_2
      ) {
        return {
          title: t("row.dealsCount"),
          children: [op.sales_transaction_name, op.sales_transaction_name_2],
        };
      } else if (op.sales_transaction_name || op.sales_transaction_name_2) {
        return {
          title: op.sales_transaction_name || op.sales_transaction_name_2 || "",
          children: [],
        };
      } else {
        return {
          title: "",
          children: [],
        };
      }
    }, [op.tip, op.sales_transaction_name, op.sales_transaction_name_2, t]);

    const isDifferentDate = op?.accrualDate !== op?.operationDate;

    // Неподтверждённая операция. Раньше весь текст строки красился в синий —
    // это трудно читать, и синий уже означает «ссылка» и «кнопка». Теперь то
    // же условие показывает небольшой бейдж рядом с суммой.
    // Для отгрузки/поставки условие обратное (синим было payment_shipment ===
    // true) — сохранено как было, смысл поля фронт не задаёт.
    const isUnconfirmed = useMemo(() => {
      switch (op.tip) {
        case "Поступление":
        case "Выплата":
          return !op.payment_confirmed && !op.payment_accrual;
        case "Начисление":
          return !op.payment_accrual;
        case "Отгрузка":
        case "Поставка":
          return Boolean(op.payment_shipment);
        case "Перемещение":
          return !op.payment_confirmed;
        default:
          return false;
      }
    }, [op]);

    return (
      <>
        <div
          key={op.guid}
          className={cn(
            "flex text-sm text-slate-900 items-stretch bg-white border-b border-slate-100 hover:bg-slate-50 cursor-pointer min-h-11 transition-colors"
          )}
          onClick={(e) => {
            if (canEdit) {
              if (!e.target.closest("input") && !e.target.closest("button")) {
                handleEditOperation(op);
              }
            }
          }}
        >
          {/* Index */}
          {showIndex && (
            <div
              className="min-w-10 flex items-center justify-center px-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm text-gray-500">{showIndex}</span>
            </div>
          )}

          {/* Date */}
          <div
            className={cn(
              "min-w-36 flex py-1 items-center justify-start "
            )}
          >
            <div className={"w-full"}>
              {op.operationParts?.length > 0 ? (
                <div
                  className={"flex items-center gap-1 pl-5 px-3 relative"}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpen(!open);
                  }}
                >
                  <span className="absolute left-0.5">
                    {" "}
                    {open ? <ExpendClose /> : <ExpendOpen />}
                  </span>
                  <span className="text-sm flex-1">{op?.operationDate}</span>
                </div>
              ) : (
                <div className="flex flex-col pl-5 px-3 items-start leading-tight">
                  <span className="text-sm">{op?.operationDate}</span>
                  {isDifferentDate && (
                    <span className="text-sm text-neutral-400">
                      {op?.accrualDate}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Account/Shot */}
          <div
            className={cn(
              "min-w-18 line-clamp-1 max-w-52 flex-1 flex px-2 py-1 items-center justify-start"
            )}
          >
            <div
              className={cn(
                "flex flex-col items-start leading-tight truncate"
              )}
            >
              {op?.tip === "Перемещение" ? (
                <>
                  <span className="truncate w-full text-sm">
                    {op.my_account_name}
                  </span>
                  <span className="truncate w-full text-sm">
                    {op.my_account_name2}
                  </span>
                </>
              ) : op.tip === "Поступление" || op.tip === "Выплата" ? (
                <span className="truncate w-full text-sm">
                  {op.my_account_name}
                </span>
              ) : op?.tip === "Начисление" ||
                op?.tip === "Отгрузка" ||
                op?.tip === "Поставка" ? (
                <span
                  className={cn(
                    "truncate w-full text-sm text-neutral-500 font-normal"
                  )}
                >
                  [{op.legal_entity_name}]
                </span>
              ) : null}
            </div>
          </div>

          {op?.paymentType && appStore.isPayment && (
            <div className="min-w-14 flex px-1 items-center justify-center">
              <div className={cn(styles.typeIcon, "scale-75")}>
                {op?.paymentType}
              </div>
            </div>
          )}

          {/* Type Icon */}
          <div className="min-w-14 flex px-1 items-center justify-center">
            <OperationTypeIcon tip={op.tip} />
          </div>

          {/* Counterparty */}
          <div
            className={cn(
              "min-w-20 flex  flex-1 px-2 py-1 items-center justify-start "
            )}
          >
            <p
              className="text-sm line-clamp-2"
              title={titleContragent}
            >
              {titleContragent}
            </p>
          </div>

          {/* Statya (Statya - Chart of Accounts) */}
          <div
            className={cn(
              "flex-1 flex flex-col px-2 py-1 items-start justify-center  min-w-20"
            )}
          >
            <div
              className="flex flex-col items-start w-full"
            >
              {op?.tip === "Перемещение" ? (
                <>
                  <span
                    className={cn(
                      "text-sm line-clamp-1 w-full",
                      isSpinasiya && "opacity-50"
                    )}
                  >
                    {t("row.transferWriteOff")}
                  </span>
                  <span
                    className={cn(
                      "text-sm line-clamp-1 w-full",
                      isZachisleniya && "opacity-50"
                    )}
                  >
                    {t("row.transferEnrollment")}
                  </span>
                </>
              ) : op.tip === "Поступление" || op.tip === "Выплата" ? (
                <>
                  <span className="text-sm  truncate w-full">
                    {titleChartOfAccounts}
                  </span>
                  {articleSubtitle && (
                    <span className="text-sm text-neutral-400 line-clamp-1 w-full">
                      {articleSubtitle}
                    </span>
                  )}
                </>
              ) : op?.tip === "Начисление" ? (
                <>
                  <span
                    className={cn(
                      "text-sm line-clamp-1 w-full",
                      isDebit && "opacity-50"
                    )}
                  >
                    {withCategory(op.chartOfAccounts, op.chart_of_accounts_id)}{" "}
                    {t("row.byDebit")}
                  </span>
                  <span
                    className={cn(
                      "text-sm line-clamp-1 w-full",
                      isCredit && "opacity-50"
                    )}
                  >
                    {withCategory(op.chartOfAccounts2, op.chart_of_accounts_id_2)}{" "}
                    {t("row.byCredit")}
                  </span>
                </>
              ) : (
                (op?.tip === "Отгрузка" || op?.tip === "Поставка") && (
                  <span className="text-sm line-clamp-1  w-full">
                    {withCategory(op.chartOfAccounts, op.chart_of_accounts_id)}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Project — колонка проекта (если включён модуль) */}
          {appStore.projectActive && (
            <div
              className={cn(
                "flex-1 flex px-2 py-1 items-center justify-start min-w-20"
              )}
            >
              <p className="text-sm text-neutral-600 truncate w-full">
                {titleProject}
              </p>
            </div>
          )}

          {/* Deal */}
          <div
            className={cn(
              "flex-1 flex px-2 py-1 items-center justify-start min-w-20"
            )}
          >
            {(op.tip === "Поступление" ||
              op.tip === "Выплата" ||
              op.tip === "Отгрузка" ||
              op.tip === "Поставка") &&
              (op?.sales_transaction_name || op?.purchase_transaction_name ? (
                <div className="flex flex-col items-start justify-center w-full">
                  {op?.sales_transaction_name && (
                    <p
                      className={cn(
                        "text-sm text-neutral-600 truncate w-full"
                      )}
                    >
                      {op.sales_transaction_name}
                    </p>
                  )}
                  {op?.purchase_transaction_name && (
                    <p
                      className={cn(
                        "text-sm text-neutral-600 truncate w-full"
                      )}
                    >
                      {op.purchase_transaction_name}
                    </p>
                  )}
                </div>
              ) : (
                <p
                  className={cn(
                    "text-sm text-neutral-600 truncate w-full"
                  )}
                >
                  -
                </p>
              ))}
            {op.tip === "Начисление" && (
              <div className="flex flex-col items-start justify-center relative group w-full">
                {titleDeals?.children?.length === 0 ? (
                  <p className="text-sm truncate w-full">
                    {titleDeals?.title || "-"}
                  </p>
                ) : (
                  <>
                    <span className="text-sm truncate w-full font-medium">
                      {titleDeals?.title}
                    </span>
                    <div className="absolute hidden group-hover:block space-y-1 w-48 z-50 bg-white shadow-xl rounded-md p-2 top-full ring-1 ring-black/5">
                      {titleDeals?.children?.map((child, idx) => (
                        <p
                          key={idx}
                          className="text-sm text-gray-600  pb-1 last:border-0"
                        >
                          {child}
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Price/Amount */}
          <div
            className="min-w-48 flex px-2 py-1 items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <PriceStatus
              amount={op.summa}
              toAmount={op.to_amount}
              tab={op.tip}
              type={op?.tip}
              op={op}
              debit={op?.debit}
              kredit={op?.kredit}
              percent={op?.percent}
              confirmed={op.payment_confirmed}
              accrual={op.payment_accrual}
              currency={op.currency}
              dealId={op?.sales_transactions_id || op?.purchase_transactions_id}
              toCurrency={op?.to_currenies_kod}
              unconfirmed={isUnconfirmed}
            />
          </div>

          {/* Menu (Actions) */}
          <div
            className="w-5 flex items-center justify-center px-1"
            onClick={(e) => e.stopPropagation()}
          >
            <OperationMenu
              operation={op}
              onEdit={handleEditOperation}
              onDelete={handleDeleteOperation}
              onCopy={handleCopyOperation}
            />
          </div>
        </div>

        {/* Child Rows (Operation Parts) */}
        {/* Колонки повторяют классы основной строки один в один. Раньше у
            частей были свои фиксированные ширины (w-32, w-40, w-15, w-52) и
            gap-1, а у основной строки — min-w + flex-1: при любой ширине окна
            даты, контрагенты и суммы частей съезжали из-под своих колонок. */}
        {open &&
          op.operationParts?.map((part) => {
            return (
              <div
                key={part.id}
                className={cn(
                  "flex text-sm items-stretch bg-slate-50/70 border-b border-slate-100 min-h-10 transition-colors hover:bg-slate-50",
                  counterpartyGuid &&
                    counterpartyGuid !== part?.counterparties_id &&
                    "opacity-40 grayscale-[0.5] pointer-events-none"
                )}
              >
                {showIndex && <div className="min-w-10 px-1" />}

                {/* Дата части — в колонке даты, со стрелкой вложенности */}
                <div className="min-w-36 flex py-1 items-center justify-start">
                  <span className="flex items-center gap-1.5 pl-5 px-3 text-sm text-slate-500">
                    <CornerDownRight size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                    {part?.accrualDate}
                  </span>
                </div>

                {/* Счёт у части общий с основной строкой */}
                <div className="min-w-18 max-w-52 flex-1 px-2 py-1" />

                {op?.paymentType && appStore.isPayment && <div className="min-w-14 px-1" />}

                <div className="min-w-14 flex px-1 items-center justify-center">
                  <OperationTypeIcon tip={part.tip} size="sm" />
                </div>

                <div className="min-w-20 flex flex-1 px-2 py-1 items-center justify-start">
                  <span className="text-sm text-slate-700 line-clamp-2">
                    {part.counterparty || ""}
                  </span>
                </div>

                <div className="flex-1 flex px-2 py-1 items-center justify-start min-w-20">
                  <span className="text-sm text-slate-700 line-clamp-1">
                    {withCategory(part.chartOfAccounts, part.chart_of_accounts_id)}
                  </span>
                </div>

                {appStore.projectActive && (
                  <div className="flex-1 flex px-2 py-1 items-center justify-start min-w-20">
                    <span className="text-sm text-slate-500 truncate w-full">
                      {part?.projectName || "-"}
                    </span>
                  </div>
                )}

                <div className="flex-1 flex px-2 py-1 items-center justify-start min-w-20">
                  <span className="text-sm text-slate-500 truncate w-full">
                    {part?.selling_deal_name || "-"}
                  </span>
                </div>

                <div className="min-w-48 flex px-2 py-1 items-center justify-end">
                  <PriceStatus
                    amount={part.summa}
                    tab={part?.tip}
                    type={part?.tip}
                    percent={part?.percent}
                    confirmed={part.payment_confirmed}
                    accrual={part.payment_accrual}
                    currency={part.currency}
                    dealId={
                      op?.sales_transactions_id || op?.purchase_transactions_id
                    }
                  />
                </div>

                {/* место под меню действий, как у основной строки */}
                <div className="w-5 px-1" />
              </div>
            );
          })}
      </>
    );
  }
);

export default memo(TableRow);
