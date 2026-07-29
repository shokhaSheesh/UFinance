"use client";

import OperationCheckbox from "@/components/shared/Checkbox/operationCheckbox";
import MultiSelect from "@/components/shared/Selects/MultiSelect";
import SingleSelect from "@/components/shared/Selects/SingleSelect";
import { COLUMN_DEFS, GROUPING_OPTIONS } from "@/modules/plans/utils/tokens";

/**
 * Панель фильтров детальной страницы бюджета — одна горизонтальная строка:
 * слева селекты (группировка, метод учёта, показатели прибыли), справа —
 * чекбоксы колонок. «Вып. плана / Откл. / Откл., %» доступны только при
 * включённом «Факт».
 *
 * extraSelects: [{ id, type: 'single'|'multi', value, options:[{value,label}],
 *                  onChange, placeholder }]
 */
const BudgetToolbar = ({
  t,
  grouping,
  onGroupingChange,
  visibleCols,
  onToggleCol,
  extraSelects = [],
}) => {
  const groupingOptions = GROUPING_OPTIONS.map((value) => ({
    value,
    label: t(`grouping.${value}`),
  }));

  return (
    <div className="border-b border-gray-200 bg-white px-6 pb-4">
      <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-3">
        <div className="w-52 shrink-0">
          <SingleSelect
            data={groupingOptions}
            value={grouping}
            onChange={onGroupingChange}
            withSearch={false}
            isClearable={false}
            className="bg-white"
          />
        </div>

        {extraSelects.map((s) => (
          <div key={s.id} className="w-52 shrink-0">
            {s.type === "multi" ? (
              <MultiSelect
                data={s.options}
                value={s.value}
                onChange={s.onChange}
                withSearch={false}
                isClearable={false}
                placeholder={s.placeholder}
                className="bg-white"
              />
            ) : (
              <SingleSelect
                data={s.options}
                value={s.value}
                onChange={s.onChange}
                withSearch={false}
                isClearable={false}
                placeholder={s.placeholder}
                className="bg-white"
              />
            )}
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          {COLUMN_DEFS.filter((c) => !c.alwaysOn).map((c) => {
            const disabled = !!c.dependsOn && !visibleCols[c.dependsOn];
            return (
              <span
                key={c.key}
                className={disabled ? "pointer-events-none opacity-40" : ""}
              >
                <OperationCheckbox
                  checked={!disabled && visibleCols[c.key]}
                  disabled={disabled}
                  onChange={() => onToggleCol(c.key)}
                  label={t(`columns.${c.key}`)}
                  title={t(`hints.${c.key}`)}
                />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetToolbar;
