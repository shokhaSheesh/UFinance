"use client";

import ToggleChip from "@/components/shared/Filters/ToggleChip";
import Segmented from "@/components/shared/Segmented/Segmented";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLUMN_DEFS, GROUPING_OPTIONS } from "@/modules/plans/utils/tokens";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

const Labelled = ({ label, children }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm text-slate-500">{label}</span>
    {children}
  </div>
);

/** Один раздел панели «Вид»: подпись сверху, переключатели под ней. */
const Section = ({ label, children }) => (
  <div className="space-y-2">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    {children}
  </div>
);

/**
 * Параметры детальной страницы бюджета. На виду только группировка — её
 * меняют постоянно. Метод учёта, показатели прибыли и колонки настраивают
 * один раз, поэтому они убраны в панель «Вид»: в одну строку всё сразу
 * читалось тяжело (запрос клиента). Счётчик на кнопке показывает, сколько
 * настроек отличается от исходных, — чтобы изменённый вид не остался
 * незамеченным. «Вып. плана / Откл. / Откл., %» доступны только при
 * включённом «Факт».
 *
 * extraSelects: [{ id, type: 'single'|'multi', value, options:[{value,label}],
 *                  onChange, placeholder, label? }]
 */
const BudgetToolbar = ({
  t,
  grouping,
  onGroupingChange,
  visibleCols,
  onToggleCol,
  extraSelects = [],
}) => {
  const td = useTranslations("Plans.budgetDetail");
  const groupingOptions = GROUPING_OPTIONS.map((value) => ({
    value,
    label: t(`grouping.${value}`),
  }));

  // Сколько настроек отличается от исходных: метод — не первый вариант,
  // показатели — каждый выбранный, колонки — каждая скрытая.
  const optionalCols = COLUMN_DEFS.filter((c) => !c.alwaysOn);
  const changed =
    extraSelects.reduce(
      (sum, s) =>
        sum + (s.type === "multi" ? s.value?.length || 0 : s.value !== s.options[0]?.value ? 1 : 0),
      0
    ) + optionalCols.filter((c) => !visibleCols[c.key]).length;

  return (
    <div className="shrink-0 px-6 pb-3">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Labelled label={td("grouping")}>
          <Segmented ariaLabel={td("grouping")} options={groupingOptions} value={grouping} onChange={onGroupingChange} />
        </Labelled>

        <Popover>
          <PopoverTrigger className="flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50">
            <SlidersHorizontal size={16} className="text-slate-500" />
            {td("view")}
            {changed > 0 ? (
              <span className="min-w-5 rounded-full bg-blue-50 px-1.5 text-center text-xs font-medium leading-5 text-blue-600">
                {changed}
              </span>
            ) : null}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[340px] gap-4 bg-white p-4">
            {extraSelects.map((s) => (
              <Section key={s.id} label={s.label || s.placeholder}>
                {s.type === "multi" ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {s.options.map((option) => {
                      const checked = s.value?.includes(option.value);
                      return (
                        <ToggleChip
                          key={option.value}
                          size="sm"
                          checked={checked}
                          onChange={() =>
                            s.onChange(checked ? s.value.filter((v) => v !== option.value) : [...(s.value || []), option.value])
                          }
                        >
                          {option.label}
                        </ToggleChip>
                      );
                    })}
                  </div>
                ) : (
                  <Segmented ariaLabel={s.label || s.placeholder} options={s.options} value={s.value} onChange={s.onChange} />
                )}
              </Section>
            ))}

            <Section label={td("columns")}>
              <div className="flex flex-wrap items-center gap-1.5">
                {optionalCols.map((c) => {
                  const disabled = !!c.dependsOn && !visibleCols[c.dependsOn];
                  return (
                    <span key={c.key} title={t(`hints.${c.key}`)} className={disabled ? "pointer-events-none opacity-40" : ""}>
                      <ToggleChip size="sm" checked={!disabled && visibleCols[c.key]} onChange={() => onToggleCol(c.key)}>
                        {t(`columns.${c.key}`)}
                      </ToggleChip>
                    </span>
                  );
                })}
              </div>
            </Section>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default BudgetToolbar;
