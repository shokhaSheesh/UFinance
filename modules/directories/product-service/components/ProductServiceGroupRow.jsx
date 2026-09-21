import RowActions from '@/components/shared/RowActions/RowActions'
import { ExpendClose, ExpendOpen } from "@/constants/icons";
import { formatNumber } from "@/utils/helpers";
import { Copy, Pencil, Trash2 } from 'lucide-react';
import React from "react";

const ProductServiceGroupRow = ({
  group,
  t,
  tc,
  isExpanded,
  permissions,
  onToggleGroup,
  onEditGroup,
  onDeleteGroup,
  onEditItem,
  onCopyItem,
  onDeleteItem,
}) => (
  <React.Fragment>
    <tr
      className="hover:bg-neutral-50 bg-neutral-50/50 font-medium cursor-pointer border-b border-gray-200"
      onClick={() => onToggleGroup(group?.guid)}
    >
      <td colSpan={6} className="p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleGroup(group?.guid);
            }}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            {isExpanded ? <ExpendClose /> : <ExpendOpen />}
          </button>
          <span className="font-semibold text-neutral-800 text-sm">
            {group?.name} ({group?.items?.length || 0})
          </span>
        </div>
      </td>
      <td className="p-3 text-center">
        <p className="text-xs font-normal text-neutral-500">{group?.type}</p>
      </td>
      <td className="p-3 text-center">
        <p className="text-xs font-normal text-neutral-500">
          {group?.commentary || group?.kommentariy}
        </p>
      </td>
      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
        {group?.guid !== "no-group" &&
          (permissions.edit || permissions.delete) && (
            <RowActions
              actions={[
                { key: 'edit', icon: Pencil, label: tc("edit"), onClick: () => onEditGroup(group), hidden: !(permissions.edit) },
                { key: 'delete', icon: Trash2, label: tc("delete"), onClick: () => onDeleteGroup(group), hidden: !(permissions.delete), danger: true },
              ]}
            />
          )}
      </td>
    </tr>

    {isExpanded && group?.items?.length === 0 && (
      <tr>
        <td colSpan={9} className="p-4 text-center text-neutral-400 text-sm">
          {t("noData")}
        </td>
      </tr>
    )}

    {isExpanded &&
      group?.items?.map((child, childIndex) => (
        <tr
          key={child?.guid || childIndex}
          className="hover:bg-neutral-50 border-b border-gray-200 text-sm"
        >
          <td className="p-3 text-start font-medium text-neutral-700 pl-8 relative">
            <div className="absolute left-4 top-1/2 -ms-1 h-full border-s border-dashed border-gray-300 -translate-y-1/2" />
            {child?.name || "—"}
          </td>
          <td className="p-3 text-start text-neutral-500">
            {child?.artikul || "—"}
          </td>
          <td className="p-3 text-end text-neutral-700">
            {child?.price
              ? `${formatNumber(child.price)} ${child?.currency || ""}`
              : "—"}
          </td>
          <td className="p-3 text-center text-neutral-500">{child?.unit}</td>
          <td className="p-3 text-center text-neutral-500">{child?.vat}</td>
          <td className="p-3 text-end text-neutral-700">
            {child?.priceWithVat
              ? `${formatNumber(child.priceWithVat)} ${child?.currency || ""}`
              : "—"}
          </td>
          <td className="p-3 text-start text-neutral-500 max-w-[160px] overflow-hidden text-overflow-ellipsis whitespace-nowrap">
            {child?.comment || child?.kommentariy || "—"}
          </td>
          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
            {(permissions.edit || permissions.delete || permissions.add) && (
              <RowActions
                actions={[
                  { key: 'edit', icon: Pencil, label: tc("edit"), onClick: () => onEditItem(child), hidden: !(permissions.edit) },
                  { key: 'copy', icon: Copy, label: tc("copy"), onClick: () => onCopyItem(child), hidden: !(permissions.add) },
                  { key: 'delete', icon: Trash2, label: tc("delete"), onClick: () => onDeleteItem(child), hidden: !(permissions.delete), danger: true },
                ]}
              />
            )}
          </td>
        </tr>
      ))}
  </React.Fragment>
);

export default ProductServiceGroupRow;
