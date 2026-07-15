"use client";

import { cn } from "@/lib/utils";
import {
  showErrorNotification,
  showSuccessNotification,
} from "@/lib/utils/notifications";
import { useState } from "react";
import { OperationModal } from "../OperationModal/OperationModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { OperationMenu } from "./OperationMenu";
import styles from "./OperationsTable.module.scss";

export function OperationsTable({ operations = [], onRowClick }) {
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [openModal, setOpenModal] = useState(null);
  const [modalType, setModalType] = useState("payment");
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isModalOpening, setIsModalOpening] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [operationToDelete, setOperationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const openOperationModal = (operation) => {
    setOpenModal(operation);
    setIsModalClosing(false);
    setIsModalOpening(true);
    document.body.style.overflow = "hidden";

    // Определяем тип модалки
    // type 'in' = поступление (зеленая стрелка ←) = income modal (зеленая)
    // type 'out' = выплата (красная стрелка →) = payment modal (красная)
    // type 'transfer' = перемещение = transfer modal (серая)
    if (operation.type === "transfer") {
      setModalType("transfer");
    } else if (operation.type === "in") {
      setModalType("income");
    } else if (operation.type === "out") {
      setModalType("payment");
    }

    // Запускаем анимацию появления
    setTimeout(() => {
      setIsModalOpening(false);
    }, 50);
  };

  const closeOperationModal = () => {
    setIsModalClosing(true);
    document.body.style.overflow = "auto";
    setTimeout(() => {
      setOpenModal(null);
      setIsModalClosing(false);
      setIsModalOpening(false);
    }, 300);
  };

  const handleEdit = (operation) => {
    openOperationModal(operation);
  };

  const handleDeleteClick = (operation) => {
    setOperationToDelete(operation);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!operationToDelete) return;

    setIsDeleting(true);
    try {
      const guid = operationToDelete.rawData?.guid || operationToDelete.guid;
      if (!guid) {
        throw new Error("GUID операции не найден");
      }

      // Используем новый API через invoke_function
      const { operationsAPI } = await import("@/lib/api/ucode/operations");
      await operationsAPI.delete([guid]);

      showSuccessNotification("Операция успешно удалена!");
      setDeleteModalOpen(false);
      setOperationToDelete(null);

      // Обновляем кеш React Query вместо перезагрузки страницы
      if (typeof window !== "undefined" && window.queryClient) {
        window.queryClient.invalidateQueries({ queryKey: ["operationsList"] });
        window.queryClient.invalidateQueries({ queryKey: ["operations"] });
      }
    } catch (error) {
      console.error("Error deleting operation:", error);
      showErrorNotification(error.message || "Ошибка при удалении операции");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setOperationToDelete(null);
  };

  return (
    <>
      <div className={styles.container}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr className={styles.tableHeaderRow}>
              <th
                className={cn(
                  styles.tableHeaderCell,
                  styles.tableHeaderCellCheckbox
                )}
              ></th>
              <th className={styles.tableHeaderCell}>Дата</th>
              <th className={styles.tableHeaderCell}>Счет</th>
              <th className={styles.tableHeaderCell}>Тип</th>
              <th className={styles.tableHeaderCell}>Контрагент</th>
              <th className={styles.tableHeaderCell}>Статья</th>
              <th className={styles.tableHeaderCell}>Проект</th>
              <th className={styles.tableHeaderCell}>Сделка</th>
              <th
                className={cn(
                  styles.tableHeaderCell,
                  styles.tableHeaderCellRight
                )}
              >
                Сумма
              </th>
              <th
                className={styles.tableHeaderCell}
                style={{ width: "3rem" }}
              ></th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {operations.map((operation) => (
              <tr
                key={operation.id}
                className={cn(
                  styles.tableRow,
                  selectedRows.includes(operation.id) && styles.selected
                )}
                onClick={() => openOperationModal(operation)}
              >
                <td
                  className={cn(styles.tableCell, styles.tableCellCheckbox)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.checkboxWrapper}>
                    <div className={styles.checkboxContainer}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(operation.id)}
                        onChange={() => toggleRow(operation.id)}
                        className={styles.checkboxInput}
                      />
                      <div
                        className={cn(
                          styles.checkbox,
                          selectedRows.includes(operation.id)
                            ? styles.checked
                            : styles.unchecked
                        )}
                      >
                        {selectedRows.includes(operation.id) && (
                          <svg
                            className={styles.checkboxIcon}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={cn(styles.tableCell, styles.dateCell)}>
                  {operation.date}
                </td>
                <td className={cn(styles.tableCell, styles.accountCell)}>
                  {operation.account}
                </td>
                <td className={cn(styles.tableCell, styles.typeCell)}>
                  <div className={styles.typeIcon}>
                    {operation.type === "in" ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15.8334 10.0001H4.16675M4.16675 10.0001L10.0001 15.8334M4.16675 10.0001L10.0001 4.16675"
                          stroke="#065986"
                          strokeWidth="1.33333"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : operation.type === "transfer" ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16.6666 14.1667H3.33325M3.33325 14.1667L6.66659 10.8333M3.33325 14.1667L6.66658 17.5M3.33325 5.83333H16.6666M16.6666 5.83333L13.3333 2.5M16.6666 5.83333L13.3333 9.16667"
                          stroke="#1D2939"
                          strokeWidth="1.33333"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3.33325 10H16.6666M16.6666 10L11.6666 5M16.6666 10L11.6666 15"
                          stroke="#F04438"
                          strokeWidth="1.33333"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </td>
                <td className={cn(styles.tableCell, styles.counterpartyCell)}>
                  {operation.kontragent}
                </td>
                <td className={cn(styles.tableCell, styles.categoryCell)}>
                  {operation.category}
                </td>
                <td className={cn(styles.tableCell, styles.projectCell)}>
                  {operation.project}
                </td>
                <td className={cn(styles.tableCell, styles.dealCell)}>
                  {operation.deal}
                </td>
                <td
                  className={cn(
                    styles.tableCell,
                    styles.amountCell,
                    operation.amount.startsWith("+")
                      ? styles.positive
                      : operation.amount.startsWith("-")
                      ? styles.negative
                      : ""
                  )}
                >
                  <div className={styles.amountWithIcons}>
                    {/* Debit icon (Дебет) - показываем если есть дата оплаты */}
                    {operation.data_oplaty && (
                      <svg
                        width="22"
                        height="27"
                        viewBox="0 0 22 27"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.debitIcon}
                      >
                        <rect width="22" height="27" rx="6" fill="#1E98AD" />
                        <path
                          d="M6.80096 20.1136V17.0625H7.36346C7.55664 16.8864 7.73846 16.6378 7.90891 16.3168C8.08221 15.9929 8.22852 15.5611 8.34783 15.0213C8.46999 14.4787 8.55096 13.7898 8.59073 12.9545L8.77823 9.27273H13.9601V17.0625H14.9657V20.0966H13.9601V18H7.80664V20.1136H6.80096ZM8.62482 17.0625H12.9544V10.2102H9.73278L9.59641 12.9545C9.56232 13.5909 9.50266 14.1676 9.41744 14.6847C9.33221 15.1989 9.22283 15.6548 9.08931 16.0526C8.95579 16.4474 8.80096 16.7841 8.62482 17.0625Z"
                          fill="#FCFCFD"
                        />
                      </svg>
                    )}
                    {/* Credit icon (Кредит) - показываем если есть дата начисления */}
                    {operation.data_nachisleniya && (
                      <svg
                        width="22"
                        height="27"
                        viewBox="0 0 22 27"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.creditIcon}
                      >
                        <rect width="22" height="27" rx="6" fill="#6C64BC" />
                        <path
                          d="M8.05682 18V9.27273H9.11364V13.6023H9.21591L13.1364 9.27273H14.517L10.8523 13.2102L14.517 18H13.2386L10.2045 13.9432L9.11364 15.1705V18H8.05682Z"
                          fill="#FCFCFD"
                        />
                      </svg>
                    )}
                    <span className={styles.amountText}>
                      {operation.amount}
                    </span>
                  </div>
                </td>
                <td
                  className={styles.tableCell}
                  onClick={(e) => e.stopPropagation()}
                >
                  <OperationMenu
                    operation={operation}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <OperationModal
        operation={openModal}
        modalType={modalType}
        isClosing={isModalClosing}
        isOpening={isModalOpening}
        onClose={closeOperationModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        operation={operationToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
    </>
  );
}
