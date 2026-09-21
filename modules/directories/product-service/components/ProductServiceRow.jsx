import RowActions from '@/components/shared/RowActions/RowActions'
import { formatNumber } from "@/utils/helpers";
import { Copy, Pencil, Trash2 } from 'lucide-react';

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
    <td className="p-2 w-px whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
      {(permissions.edit || permissions.delete || permissions.add) && (
        <RowActions
          actions={[
            { key: 'edit', icon: Pencil, label: tc("edit"), onClick: () => onEdit(item), hidden: !(permissions.edit) },
            { key: 'copy', icon: Copy, label: tc("copy"), onClick: () => onCopy(item), hidden: !(permissions.add) },
            { key: 'delete', icon: Trash2, label: tc("delete"), onClick: () => onDelete(item), hidden: !(permissions.delete), danger: true },
          ]}
        />
      )}
    </td>
  </tr>
);

export default ProductServiceRow;
