"use client";

import CreateGroup from "@/components/directories/ProductServices/CreateGroup";
import CreateSingle from "@/components/directories/ProductServices/CreateSingle";
import { ConfirmDialog } from "@/components/shared/CustomDialog";
import CustomModal from "@/components/shared/CustomModal";
import Input from "@/components/shared/Input";
import ScreenLoader from "@/components/shared/ScreenLoader";
import Segmented from "@/components/shared/Segmented/Segmented";
import TableCard from "@/components/shared/Table/TableCard";
import TableToolbar from "@/components/shared/Table/TableToolbar";
import FixedContent from "@/layouts/FixedContent";
import { appStore } from "@/store/app.store";
import { Package, Search, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

import ProductServiceGroupRow from "../components/ProductServiceGroupRow";
import ProductServiceHeader from "../components/ProductServiceHeader";
import ProductServiceRow from "../components/ProductServiceRow";
import ProductServiceTableHeader from "../components/ProductServiceTableHeader";
import { useProductServiceData } from "../hooks/useProductServiceData";
import { useProductServiceModals } from "../hooks/useProductServiceModals";

export default observer(function ProductServiceListPage() {
  const t = useTranslations("Directories.product");
  const tc = useTranslations("Common");

  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    productServicesList,
    totalItemsCount,
    isLoading,
  } = useProductServiceData(t, tc);

  const {
    isCreateSingleOpen,
    createType,
    setIsCreateSingleOpen,
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    itemToDelete,
    setItemToDelete,
    isDeletingItem,
    errorGroup,
    setErrorGroup,
    usedItem,
    setUsedItem,
    editGroup,
    setEditGroup,
    itemToEdit,
    setItemToEdit,
    isCopying,
    setIsCopying,
    handleCreateSingle,
    handleCreateGroup,
    handleDeleteConfirm,
    requestDelete,
  } = useProductServiceModals(t);

  const productsServicesPermissions =
    appStore.permission.directories.productsServices;

  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllExpanded = useMemo(() => {
    const groupCount = productServicesList.filter(
      (item) => item.isGroup
    ).length;
    return groupCount > 0 && expandedGroups.size === groupCount;
  }, [expandedGroups, productServicesList]);

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedGroups(new Set());
    } else {
      const allGroupIds = productServicesList
        .filter((item) => item.isGroup)
        .map((g) => g.guid);
      setExpandedGroups(new Set(allGroupIds));
    }
  };

  const handleEditItem = (item) => {
    setItemToEdit(item.raw || item);
    setIsCopying(false);
    setIsCreateSingleOpen(true);
  };

  const handleCopyItem = (item) => {
    setItemToEdit(item.raw || item);
    setIsCopying(true);
    setIsCreateSingleOpen(true);
  };

  const handleEditGroup = (group) => {
    setItemToEdit(group.raw || group);
    setIsCopying(false);
    setIsCreateGroupOpen(true);
    setEditGroup(group);
  };

  // Block body scroll when page is mounted
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <FixedContent className="flex min-h-0 flex-1 flex-col overflow-auto bg-canvas px-6 pb-6">
        {isLoading && <ScreenLoader />}

        <ProductServiceHeader
          t={t}
          tc={tc}
          canAdd={productsServicesPermissions.add}
          count={isLoading ? null : totalItemsCount}
          onCreateSingle={handleCreateSingle}
          onCreateGroup={handleCreateGroup}
        />

        <TableCard>
          {/* Поиск и фильтры — в панели над таблицей, как на других страницах */}
          <TableToolbar
            search={
              <div className="w-full max-w-[420px]">
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search size={18} />}
                />
              </div>
            }
            actions={
              <>
                <Segmented
                  ariaLabel={t('types.all')}
                  value={filters.type}
                  onChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
                  options={[
                    { value: 'all', label: t('types.all') },
                    { value: 'product', label: t('types.products') },
                    { value: 'service', label: t('types.services') },
                  ]}
                />
                <Segmented
                  ariaLabel={t('grouping.none')}
                  value={filters.group}
                  onChange={(value) => setFilters((prev) => ({ ...prev, group: value }))}
                  options={[
                    { value: 'none', label: t('grouping.none') },
                    { value: 'group', label: t('grouping.group') },
                  ]}
                />
              </>
            }
          />

        <div id="table-container" className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <ProductServiceTableHeader
              t={t}
              filters={filters}
              isAllExpanded={isAllExpanded}
              toggleExpandAll={toggleExpandAll}
            />
            <tbody className="flex-1 overflow-y-auto">
              {productServicesList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <span className="flex flex-col items-center gap-2">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Package size={22} aria-hidden="true" />
                      </span>
                      <span className="text-sm text-slate-500">{searchQuery ? t("noResults") : t("noData")}</span>
                    </span>
                  </td>
                </tr>
              ) : (
                productServicesList.map((item, index) => {
                  if (item.isGroup) {
                    const isExpanded = expandedGroups.has(item.guid);
                    return (
                      <ProductServiceGroupRow
                        key={item.guid}
                        group={item}
                        t={t}
                        tc={tc}
                        isExpanded={isExpanded}
                        permissions={productsServicesPermissions}
                        onToggleGroup={toggleGroup}
                        onEditGroup={handleEditGroup}
                        onDeleteGroup={(group) => setItemToDelete(group)}
                        onEditItem={handleEditItem}
                        onCopyItem={handleCopyItem}
                        onDeleteItem={(child) => requestDelete(child)}
                      />
                    );
                  } else {
                    return (
                      <ProductServiceRow
                        key={item.guid || index}
                        item={item}
                        tc={tc}
                        permissions={productsServicesPermissions}
                        onEdit={handleEditItem}
                        onCopy={handleCopyItem}
                        onDelete={(item) => requestDelete(item)}
                      />
                    );
                  }
                })
              )}
            </tbody>
          </table>
        </div>
        </TableCard>
      </FixedContent>

      <CreateSingle
        open={isCreateSingleOpen}
        setOpen={(open) => {
          setIsCreateSingleOpen(open);
          if (!open) {
            setItemToEdit(null);
            setIsCopying(false);
          }
        }}
        initialData={itemToEdit}
        initialType={createType}
        isEditing={!!itemToEdit && !isCopying}
      />

      <CreateGroup
        initialData={editGroup}
        open={isCreateGroupOpen}
        setOpen={() => setIsCreateGroupOpen(false)}
      />

      <ConfirmDialog
        open={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeletingItem}
        icon={Trash2}
        title={`Удалить ${itemToDelete?.isGroup ? "группу" : "товар"}`}
        message={
          itemToDelete?.isGroup
            ? `Вы действительно хотите удалить группу «${itemToDelete.name}»? Восстановить её будет невозможно.`
            : `Вы действительно хотите удалить товар «${itemToDelete?.name}»? Восстановить его будет невозможно.`
        }
        cancelLabel="Отменить"
        confirmLabel="Удалить"
      />

      {/* Товар уже используется в операциях/сделках — удалить нельзя */}
      <CustomModal isOpen={!!usedItem} onClose={() => setUsedItem(null)}>
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 9L9 15"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 9L15 15"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 font-sans">
            {"Удаление невозможно"}
          </h2>
        </div>
        <p className="mb-7 text-sm text-neutral-600 leading-5 font-sans">
          {"Товар «"}
          <strong>{usedItem?.name}</strong>
          {
            "» уже используется в сделках или операциях, поэтому удалить его нельзя."
          }
        </p>
        <div className="flex justify-end items-center">
          <button
            onClick={() => setUsedItem(null)}
            className="bg-[#00A389] text-white font-semibold text-sm px-5 py-2 rounded-md hover:bg-[#048F7C] cursor-pointer"
          >
            {"Закрыть"}
          </button>
        </div>
      </CustomModal>

      <CustomModal isOpen={!!errorGroup} onClose={() => setErrorGroup(null)}>
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 9L9 15"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 9L15 15"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-sans">
              {"Ошибка удаления группы"}
            </h2>
          </div>
        </div>
        <p className="mb-7 text-sm text-neutral-600 leading-5 font-sans">
          {"К группе «"}
          <strong>{errorGroup?.name}</strong>
          {
            "» относятся товары/услуги. Чтобы удалить группу, переместите их в другую группу или удалите их."
          }
        </p>
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              if (errorGroup?.guid) toggleGroup(errorGroup.guid);
              setErrorGroup(null);
            }}
            className="bg-transparent text-[#00A389] font-semibold text-sm hover:underline cursor-pointer"
          >
            {"Посмотреть элементы"}
          </button>
          <button
            onClick={() => setErrorGroup(null)}
            className="bg-[#00A389] text-white font-semibold text-sm px-5 py-2 rounded-md hover:bg-[#048F7C] cursor-pointer"
          >
            {"Закрыть"}
          </button>
        </div>
      </CustomModal>
    </>
  );
});
