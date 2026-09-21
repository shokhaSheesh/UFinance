"use client";

import CreateGroup from "@/components/directories/ProductServices/CreateGroup";
import CreateSingle from "@/components/directories/ProductServices/CreateSingle";
import CustomModal from "@/components/shared/CustomModal";
import Loader from "@/components/shared/Loader";
import ScreenLoader from "@/components/shared/ScreenLoader";
import FixedContent from "@/layouts/FixedContent";
import { appStore } from "@/store/app.store";
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
    isLoading,
  } = useProductServiceData(t, tc);

  const {
    isCreateSingleOpen,
    setIsCreateSingleOpen,
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    isMenuOpen,
    setIsMenuOpen,
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
      <FixedContent className="flex bg-white overflow-y-auto pb-20 flex-col flex-1 gap-4">
        {isLoading && <ScreenLoader />}

        <ProductServiceHeader
          t={t}
          tc={tc}
          canAdd={productsServicesPermissions.add}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          onCreateSingle={handleCreateSingle}
          onCreateGroup={handleCreateGroup}
          filters={filters}
          setFilters={setFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div id="table-container" className="flex-1 w-full px-3 bg-white">
          <table className="w-full max-h-[calc(100vh-60px)] overflow-y-auto">
            <ProductServiceTableHeader
              t={t}
              filters={filters}
              isAllExpanded={isAllExpanded}
              toggleExpandAll={toggleExpandAll}
            />
            <tbody className="flex-1 overflow-y-auto">
              {productServicesList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-400">
                    {t("noData")}
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
      </FixedContent>

      <div className="fixed bottom-0 left-[var(--sidebar-w)] py-4 px-3 right-0 bg-white border-t border-gray-200">
        <span className={"lowercase"}>{t("footer.total", { count: 3 })}</span>
      </div>

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
        isEditing={!!itemToEdit && !isCopying}
      />

      <CreateGroup
        initialData={editGroup}
        open={isCreateGroupOpen}
        setOpen={() => setIsCreateGroupOpen(false)}
      />

      <CustomModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
      >
        <div className="flex flex-col gap-6 p-2">
          <h2 className="text-xl font-bold text-neutral-900 font-sans">
            {"Удалить"} {itemToDelete?.isGroup ? "группу" : "товар"}
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed font-sans">
            {itemToDelete?.isGroup
              ? `Вы действительно хотите удалить группу «${itemToDelete.name}»? Восстановить её будет невозможно.`
              : `Вы действительно хотите удалить товар «${itemToDelete?.name}»? Восстановить его будет невозможно.`}
          </p>
          <div className="flex justify-end items-center gap-6 mt-2">
            <button
              onClick={() => setItemToDelete(null)}
              className="text-[#00A389] font-semibold text-sm hover:underline cursor-pointer"
            >
              {"Отменить"}
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#F04438] rounded-md hover:bg-[#D92D20] transition-colors cursor-pointer min-w-[100px]"
              disabled={isDeletingItem}
            >
              {isDeletingItem ? <Loader size={20} color="white" /> : "Удалить"}
            </button>
          </div>
        </div>
      </CustomModal>

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
