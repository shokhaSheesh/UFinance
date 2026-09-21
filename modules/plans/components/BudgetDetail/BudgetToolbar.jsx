"use client";

import ToggleChip from "@/components/shared/Filters/ToggleChip";
import Segmented from "@/components/shared/Segmented/Segmented";
import { COLUMN_DEFS, GROUPING_OPTIONS } from "@/modules/plans/utils/tokens";
import { useTranslations } from "next-intl";

const Labelled = ({ label, children }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm text-slate-500">{label}</span>
    {children}
  </div>
);

/**
 * Параметры детальной страницы бюджета: группировка и метод учёта —
 * переключателями, показатели прибыли и колонки — «пилюлями».
 * Раньше это были выпадающие списки и мелкие чекбоксы: чтобы увидеть, что
 * выбрано, список нужно было открыть. «Вып. плана / Откл. / Откл., %»
 * доступны только при включённом «Факт».
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

  return (
    <div className="shrink-0 px-6 pb-3">
      <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-2">
        <Labelled label={td("grouping")}>
          <Segmented ariaLabel={td("grouping")} options={groupingOptions} value={grouping} onChange={onGroupingChange} />
        </Labelled>

        {extraSelects.map((s) =>
          s.type === "multi" ? (
            <Labelled key={s.id} label={s.label || s.placeholder}>
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
            </Labelled>
          ) : (
            <Labelled key={s.id} label={s.label || s.placeholder}>
              <Segmented ariaLabel={s.label || s.placeholder} options={s.options} value={s.value} onChange={s.onChange} />
            </Labelled>
          )
        )}

        <Labelled label={td("columns")}>
          <div className="flex flex-wrap items-center gap-1.5">
            {COLUMN_DEFS.filter((c) => !c.alwaysOn).map((c) => {
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
        </Labelled>
      </div>
    </div>
  );
};

export default BudgetToolbar;
