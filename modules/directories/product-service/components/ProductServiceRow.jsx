import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/helpers";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { IoCopyOutline } from "react-icons/io5";

const ProductServiceRow = ({
  item,
  tc,
  permissions,
  onEdit,
  onCopy,
  onDelete,
}) => (
  <tr className="hover:bg-neutral-50 border-b border-gray-200 text-sm">
    <td className="p-3 text-start font-medium text-neutral-700">
      {item?.name || "—"}
    </td>
    <td className="p-3 text-start font-normal text-xs text-neutral-500">
      {item?.type || "—"}
    </td>
    <td className="p-3 text-start text-neutral-500">{item?.artikul || "—"}</td>
    <td className="p-3 text-end text-neutral-700">
      {item?.price
        ? `${formatNumber(item.price)} ${item?.currency || ""}`
        : "—"}
    </td>
    <td className="p-3 text-center text-neutral-500">{item?.unit}</td>
    <td className="p-3 text-center text-neutral-500">{item?.vat}</td>
    <td className="p-3 text-end text-neutral-700">
      {item?.priceWithVat
        ? `${formatNumber(item.priceWithVat)} ${item?.currency || ""}`
        : "—"}
    </td>
    <td className="p-3 text-start text-neutral-500 max-w-[160px] overflow-hidden text-overflow-ellipsis whitespace-nowrap">
      {item?.raw?.kommentariy || "—"}
    </td>
    <td className="p-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
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
                  onClick={() => onEdit(item)}
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
                  onClick={() => onCopy(item)}
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
                  onClick={() => onDelete(item)}
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
);

export default ProductServiceRow;
