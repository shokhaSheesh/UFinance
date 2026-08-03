import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExpendClose, ExpendOpen } from "@/constants/icons";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/helpers";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import React from "react";
import { IoCopyOutline } from "react-icons/io5";

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="p-1 hover:bg-neutral-200 cursor-pointer rounded-full inline-flex items-center justify-center">
                  <MoreVertical size={16} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 p-2" align="end">
                {permissions.edit && (
                  <DropdownMenuItem asChild>
                    <button
                      className={cn(
                        "w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none"
                      )}
                      onClick={() => onEditGroup(group)}
                    >
                      <Pencil size={16} />
                      <span>{tc("edit")}</span>
                    </button>
                  </DropdownMenuItem>
                )}
                {permissions.delete && (
                  <DropdownMenuItem asChild>
                    <button
                      className={cn(
                        "w-full flex items-center text-red-500 cursor-pointer text-sm gap-2 justify-start outline-none"
                      )}
                      onClick={() => onDeleteGroup(group)}
                    >
                      <Trash2 size={16} className="text-red-500" />
                      <span>{tc("delete")}</span>
                    </button>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="p-1 hover:bg-neutral-200 cursor-pointer rounded-full inline-flex items-center justify-center">
                    <MoreVertical size={16} />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40 p-2" align="end">
                  {permissions.edit && (
                    <DropdownMenuItem asChild>
                      <button
                        className={cn(
                          "w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none"
                        )}
                        onClick={() => onEditItem(child)}
                      >
                        <Pencil size={16} />
                        <span>{tc("edit")}</span>
                      </button>
                    </DropdownMenuItem>
                  )}
                  {permissions.add && (
                    <DropdownMenuItem asChild>
                      <button
                        className={cn(
                          "w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none"
                        )}
                        onClick={() => onCopyItem(child)}
                      >
                        <IoCopyOutline size={16} />
                        <span>{tc("copy")}</span>
                      </button>
                    </DropdownMenuItem>
                  )}
                  {permissions.delete && (
                    <DropdownMenuItem asChild>
                      <button
                        className={cn(
                          "w-full flex items-center text-red-500 cursor-pointer text-sm gap-2 justify-start outline-none"
                        )}
                        onClick={() => onDeleteItem(child)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                        <span>{tc("delete")}</span>
                      </button>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </td>
        </tr>
      ))}
  </React.Fragment>
);

export default ProductServiceGroupRow;
