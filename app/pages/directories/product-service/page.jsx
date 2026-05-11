"use client"
import { cn } from '@/app/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, MoreVertical, Pencil, Search, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import CreateGroup from '../../../../components/directories/ProductServices/CreateGroup'
import CreateSingle from '../../../../components/directories/ProductServices/CreateSingle'
import Input from '../../../../components/shared/Input'
import { useUcodeDefaultApiMutation, useUcodeDefaultApiQuery, useUcodeRequestQuery } from '../../../../hooks/useDashboard'

import { observer } from 'mobx-react-lite'
import { IoCopyOutline } from "react-icons/io5"
import OperationCheckbox from '../../../../components/shared/Checkbox/operationCheckbox'
import CustomModal from '../../../../components/shared/CustomModal'
import Loader from '../../../../components/shared/Loader'
import ScreenLoader from '../../../../components/shared/ScreenLoader'
import SingleSelect from '../../../../components/shared/Selects/SingleSelect'
import { ExpendClose, ExpendOpen } from '../../../../constants/icons'
import { appStore } from '../../../../store/app.store'


export default observer(function LegalEntitiesPage() {
  const t = useTranslations('Directories.product')
  const tc = useTranslations('Common')
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [isCreateSingleOpen, setIsCreateSingleOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [filters, setFilters] = useState({
    type: 'Все',
    group: 'none',
  })

  // State for debounced filters (1 second delay)
  const [requestFilters, setRequestFilters] = useState(filters)

  // Debounce filter changes with 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setRequestFilters(filters)
    }, 1000)

    return () => clearTimeout(timer)
  }, [filters])

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [errorGroup, setErrorGroup] = useState(null)
  const [editGroup, setEditGroup] = useState(null)
  const [itemToEdit, setItemToEdit] = useState(null)
  const [isCopying, setIsCopying] = useState(false)
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const menuRef = useRef(null)
  const rowMenuRef = useRef(null)

  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const toggleGroup = (id) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const { mutateAsync: deleteProductService } = useUcodeDefaultApiMutation({ mutationKey: 'DELETE_PRODUCT_SERVICE' })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const productsServicesPermissions = appStore.permission.directories.productsServices

  // Close row action menu on outside click
  useEffect(() => {
    const handleRowMenuClose = (event) => {
      if (rowMenuRef.current && !rowMenuRef.current.contains(event.target)) {
        setOpenRowMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleRowMenuClose)
    return () => document.removeEventListener('mousedown', handleRowMenuClose)
  }, [])

  const { data: productServices, isLoading } = useUcodeRequestQuery({
    method: "list_products_and_services",
    data: {
      page: 1,
      limit: 100,
      from_date: "",
      to_date: "",
      search: debouncedSearchQuery,
      type: requestFilters?.type,
    },
    querySetting: {
      select: data => data?.data
    }
  })

  const { data: productServicesGrouped } = useUcodeDefaultApiQuery({
    queryKey: 'product-services-grouped',
    urlMethod: 'GET',
    urlParams: '/items/group_product_and_service?from-ofs=true&offset=0&limit=10',
    querySetting: {
      select: data => data?.data?.data?.response
    }
  });

  const productServicesList = useMemo(() => {
    const rawList = productServices?.data?.filter(item => filters?.type === 'Все' ? true : item?.Status?.includes(filters?.type)).map(item => {
      const price = Number(item?.TSena_za_ed) || 0;
      const vatStr = item?.NDS || '';
      const vatNum = parseFloat(vatStr) || 0;
      const priceWithVat = vatNum > 0 ? price * (1 + vatNum / 100) : price;

      const groupResponse = productServicesGrouped;
      const groupData = groupResponse?.find(g => g.guid === item?.product_and_service_group_id);
      const groupName = groupData ? (groupData.name || groupData.nazvanie_gruppy || t('noGroup')) : t('noGroup');
      const groupId = item?.product_and_service_group_id || 'no-group';

      return {
        guid: item?.guid,
        name: item?.Naimenovanie,
        artikul: item?.Artikul,
        group: groupName,
        price,
        unit: item?.unit_name || '—',
        vat: vatStr ? `${vatStr}%` : '—',
        priceWithVat: Math.round(priceWithVat),
        comment: item?.Kommentariy || '',
        type: item?.Status ? item?.Status?.[0] === 'product' ? t('types.products') : t('types.services') : '',
        raw: item,
        currency: item?.currenies_symbol,
        groupName: groupName,
        groupId: groupId
      }
    }) || []

    if (filters?.group === 'none') {
      return rawList;
    }

    const groupsMap = new Map();

    if (productServicesGrouped) {
      productServicesGrouped.forEach(group => {
        groupsMap.set(group.guid, {
          isGroup: true,
          guid: group.guid,
          name: group.name || group.nazvanie_gruppy || tc('noName'),
          items: [],
          raw: group,
          commentary: group.commentary,
        });
      });
    }

    rawList.forEach(item => {
      if (!groupsMap.has(item.groupId)) {
        groupsMap.set(item.groupId, {
          isGroup: true,
          guid: item.groupId,
          name: item.groupName,
          items: []
        });
      }
      groupsMap.get(item.groupId).items.push(item);
    });

    const groupedArray = Array.from(groupsMap.values());
    groupedArray.sort((a, b) => {
      if (a.guid === 'no-group') return -1;
      if (b.guid === 'no-group') return 1;
      return a.name.localeCompare(b.name);
    });

    return groupedArray;
  }, [productServices, productServicesGrouped, filters, t, tc])

  const isAllExpanded = useMemo(() => {
    const groupCount = productServicesList.filter(item => item.isGroup).length;
    return groupCount > 0 && expandedGroups.size === groupCount;
  }, [expandedGroups, productServicesList])

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedGroups(new Set())
    } else {
      const allGroupIds = productServicesList.filter(item => item.isGroup).map(g => g.guid);
      setExpandedGroups(new Set(allGroupIds))
    }
  }


  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleCreateSingle = () => {
    setItemToEdit(null)
    setIsCopying(false)
    setIsCreateSingleOpen(true)
    setIsMenuOpen(false)
  }

  const handleCreateGroup = () => {
    setIsCreateGroupOpen(true)
    setIsMenuOpen(false)
  }


  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])



  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.guid) return;

    // If user wants to delete a group with items/children
    if (itemToDelete.isGroup && itemToDelete.items && itemToDelete.items.length > 0) {
      setErrorGroup(itemToDelete);
      setItemToDelete(null); // close confirmation modal
      return;
    }

    setIsDeletingItem(true);
    try {
      const isGroup = itemToDelete.isGroup;
      await deleteProductService({
        urlMethod: 'DELETE',
        urlParams: isGroup
          ? `/items/group_product_and_service/${itemToDelete.guid}?from-ofs=true`
          : `/items/product_and_service/${itemToDelete.guid}?from-ofs=true`,
        data: { guid: itemToDelete.guid }
      });
      queryClient.invalidateQueries({ queryKey: ['get_product_services_list'] });
      if (isGroup) {
        queryClient.invalidateQueries({ queryKey: ['product-services-grouped'] });
      }
      queryClient.invalidateQueries({ queryKey: ['list_products_and_services'] });
      setItemToDelete(null);
      showSuccessNotification(t('successDeleted'));
    } catch (error) {
      console.error('Delete error:', error);
      showErrorNotification(t('deleteError'));
    } finally {
      setIsDeletingItem(false);
    }
  }

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const guids = Array.from(selectedItems);
      await deleteProductService({
        urlMethod: 'DELETE',
        urlParams: `/object/operations`,
        data: { ids: guids }
      });
      queryClient.invalidateQueries({ queryKey: ['get_product_services_list'] });
      queryClient.invalidateQueries({ queryKey: ['list_products_and_services'] });
      setSelectedItems(new Set());
      setIsBulkDeleteModalOpen(false);
      showSuccessNotification(t('bulkSuccessDeleted'));
    } catch (error) {
      console.error('Bulk delete error:', error);
      showErrorNotification(t('bulkDeleteError'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const totalItemsCount = useMemo(() => {
    return productServices?.total
  }, [productServices])

  // Block body scroll when page is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSelectAll = () => {
    let allItemGuids = []
    if (filters.type === 'group') {
      productServicesList.forEach(group => {
        group.items?.forEach(item => allItemGuids.push(item.guid))
      })
    } else {
      allItemGuids = productServicesList.map(item => item.guid)
    }

    if (selectedItems.size === allItemGuids.length && allItemGuids.length > 0) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(allItemGuids))
    }
  }

  const handleSelectChilds = (group) => {
    const childGuids = group.items?.map(item => item.guid) || []
    setSelectedItems(prev => {
      const next = new Set(prev)
      const isAllSelected = childGuids.every(guid => next.has(guid))
      if (isAllSelected) {
        childGuids.forEach(guid => next.delete(guid))
      } else {
        childGuids.forEach(guid => next.add(guid))
      }
      return next
    })
  }

  const handleSelectChild = (child) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(child.guid)) {
        next.delete(child.guid)
      } else {
        next.add(child.guid)
      }
      return next
    })
  }

  return (
    <>
      <div className="flex fixed bg-white overflow-y-auto pb-20  left-[80px] top-[60px] flex-col flex-1 w-[calc(100%-80px)] h-[calc(100%-60px)]  gap-4">
        {isLoading && <ScreenLoader />}
        <div className="flex items-center sticky top-0 bg-white z-10 p-3 justify-between">
          <div className="flex items-center gap-3">
            <h1 className="h1 text-xl text-neutral-700 font-semibold">{t('pageTitle')}</h1>
            {productsServicesPermissions.add && <div ref={menuRef} className="flex items-center z-20 gap-2 relative">
              <button onClick={handleMenuClick} className="primary-btn flex items-center gap-2 ">
                {tc('create')}
                {isMenuOpen ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
              {isMenuOpen && (
                <div style={{ zIndex: 999999 }} className="absolute top-full  w-32 p-2 flex flex-col justify-start items-start left-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg ">
                  <button
                    className=" text-neutral-700 font-normal hover:bg-neutral-100 w-full text-start text-sm p-1 cursor-pointer"
                    onClick={handleCreateSingle}
                  >
                    {tc('create')}
                  </button>
                  <button
                    className=" text-neutral-700 font-normal hover:bg-neutral-100 w-full text-start text-sm p-1 cursor-pointer"
                    onClick={handleCreateGroup}
                  >
                    {t('createGroupTitle')}
                  </button>
                </div>
              )}
            </div>}
          </div>
          <div className="flex items-center gap-2 ">
            <div className="w-32 h-10">
              <SingleSelect
                data={[
                  { value: 'Все', label: t('types.all') },
                  { value: 'Товары', label: t('types.products') },
                  { value: 'Услуги', label: t('types.services') }
                ]}
                value={filters.type}
                withSearch={false}
                isClearable={false}
                onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                className={'bg-white'}
              />
            </div>
            <div className="w-44 h-10">
              <SingleSelect
                data={[
                  { value: 'none', label: t('grouping.none') },
                  { value: 'group', label: t('grouping.group') }
                ]}
                value={filters.group}
                withSearch={false}
                isClearable={false}
                onChange={(value) => setFilters(prev => ({ ...prev, group: value }))}
                className={'bg-white'}
              />
            </div>
            <div className="w-64 h-10">
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
                className={'bg-white h-[34px]'}
              />
            </div>
          </div>
        </div>
        <div id="table-container" className="flex-1 w-full px-3 bg-white">
          <table className='w-full max-h-[calc(100vh-60px)] overflow-y-auto '>
            <thead className=' sticky top-16'>
              <tr className={cn('bg-neutral-100 text-neutral-500 font-normal py-4 text-xs w-full border-b border-gray-300', selectedItems.size > 0 && 'bg-neutral-50')}>
                <th className='w-10'>
                  <div className=' flex items-center justify-center'>
                    <OperationCheckbox
                      checked={selectedItems.size === totalItemsCount && totalItemsCount > 0}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
                {selectedItems.size > 0 ? (
                  <th colSpan={9} className='py-1 px-2'>
                    <div className='flex items-center gap-6'>
                      <span className='font-semibold text-sm text-neutral-700'>{t('selected')}: {selectedItems.size}</span>
                      <div className='flex items-center gap-4'>
                        {productsServicesPermissions.delete && <button
                          onClick={() => setIsBulkDeleteModalOpen(true)}
                          className='flex items-center gap-1.5 text-red-500 hover:text-red-600 font-medium cursor-pointer'
                        >
                          <Trash2 size={16} />
                          <span>{tc('delete')}</span>
                        </button>}
                      </div>
                    </div>
                  </th>
                ) : (
                  <>
                      <th className='p-2 text-start'>
                        <div className="flex items-center gap-2">
                          {filters?.group?.value === 'group' && (
                            <button
                              onClick={toggleExpandAll}
                              className="p-1 hover:bg-neutral-200 rounded cursor-pointer"
                            >
                              {isAllExpanded ? <ExpendClose /> : <ExpendOpen />}
                            </button>
                          )}
                          <span>{t('tableHeaders.name')}</span>
                        </div>
                      </th>
                      <th className='p-2 text-start'> {t('tableHeaders.type')}</th>
                      <th className='p-2 text-start'> {t('tableHeaders.article')}</th>
                      <th className='p-2 text-end'> {t('tableHeaders.price')}</th>
                      <th className='p-2 text-center'> {t('tableHeaders.unit')}</th>
                      <th className='p-2 text-center'> {t('tableHeaders.vat')}</th>
                      <th className='p-2 text-end'> {t('tableHeaders.priceWithVat')}</th>
                      <th className='p-2 text-start'> {t('tableHeaders.comment')}</th>
                      <th className='p-2 text-start w-10'> &nbsp;</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className=' flex-1 overflow-y-auto'>
              {productServicesList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-400">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                productServicesList.map((item, index) => {
                  if (item.isGroup) {
                    const isExpanded = expandedGroups.has(item.guid);
                    const isAllChildsSelected = item?.items?.length > 0 && item.items.every(child => selectedItems.has(child.guid));
                    return (
                      <React.Fragment key={item.guid}>
                        <tr
                          className="hover:bg-neutral-50 bg-neutral-50/50 font-medium cursor-pointer border-b border-gray-200"
                          onClick={() => toggleGroup(item.guid)}
                        >
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center">
                              <OperationCheckbox checked={isAllChildsSelected} onChange={() => handleSelectChilds(item)} />
                            </div>
                          </td>
                          <td colSpan={6} className="p-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleGroup(item.guid); }}
                                className="p-1 hover:bg-neutral-100 rounded"
                              >
                                {isExpanded ? <ExpendClose /> : <ExpendOpen />}
                              </button>
                              <span className="font-semibold text-neutral-800 text-sm">
                                {item.name} ({item.items.length})
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <p className='text-xs font-normal text-neutral-500'>{item.type}</p>
                          </td>
                          <td className="p-3 text-center">
                            <p className='text-xs font-normal text-neutral-500'>{item.commentary}</p>
                          </td>
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {item.guid !== 'no-group' && (productsServicesPermissions.edit || productsServicesPermissions.delete) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <div className="p-1 hover:bg-neutral-200 cursor-pointer rounded-full inline-flex items-center justify-center">
                                    <MoreVertical size={16} />
                                  </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40 p-2" align="end">
                                  {productsServicesPermissions.edit && <DropdownMenuItem asChild>
                                    <button
                                      className={cn("w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none")}
                                      onClick={() => {
                                        setItemToEdit(item.raw || item); setIsCopying(false); setIsCreateGroupOpen(true);
                                        setEditGroup(item)
                                      }}
                                    >
                                      <Pencil size={16} />
                                      <span>{tc('edit')}</span>
                                    </button>
                                  </DropdownMenuItem>}
                                  {productsServicesPermissions.delete && <DropdownMenuItem asChild>
                                    <button
                                      className={cn("w-full flex items-center text-red-500 cursor-pointer text-sm gap-2 justify-start outline-none")}
                                      onClick={() => { setItemToDelete(item); }}
                                    >
                                      <Trash2 size={16} className='text-red-500' />
                                      <span>{tc('delete')}</span>
                                    </button>
                                  </DropdownMenuItem>}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        </tr>

                        {isExpanded && item.items.length === 0 && (
                          <tr>
                            <td colSpan={9} className="p-4 text-center text-neutral-400 text-sm">
                              {t('noData')}
                            </td>
                          </tr>
                        )}

                        {isExpanded && item.items.map((child, childIndex) => (
                          <tr key={child.guid || childIndex} className="hover:bg-neutral-50 border-b border-gray-200 text-sm">
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center">
                                <OperationCheckbox checked={selectedItems.has(child.guid)} onChange={() => handleSelectChild(child)} />
                              </div>
                            </td>
                            <td className="p-3 text-start font-medium text-neutral-700 pl-8 relative">
                              <div className="absolute left-4 top-1/2 -ms-1  h-full border-s border-dashed border-gray-300 -translate-y-1/2" />
                              {child.name || '—'}
                            </td>
                            <td className="p-3 text-start text-neutral-500">{child.artikul || '—'}</td>
                            <td className="p-3 text-end text-neutral-700">{child.price ? `${child.price.toLocaleString('ru-RU')} ${child.currency}` : '—'}</td>
                            <td className="p-3 text-center text-neutral-500">{child.unit}</td>
                            <td className="p-3 text-center text-neutral-500">{child.vat} </td>
                            <td className="p-3 text-end text-neutral-700">{child.priceWithVat ? `${child.priceWithVat.toLocaleString('ru-RU')} ${child.currency}` : '—'}</td>
                            <td className="p-3 text-start text-neutral-500 max-w-[160px] overflow-hidden text-overflow-ellipsis whitespace-nowrap">{child.comment || '—'}</td>
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {(productsServicesPermissions.edit || productsServicesPermissions.delete || productsServicesPermissions.add) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <div className="p-1 hover:bg-neutral-200 cursor-pointer rounded-full inline-flex items-center justify-center">
                                      <MoreVertical size={16} />
                                    </div>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-40 p-2" align="end">
                                    {productsServicesPermissions.edit && <DropdownMenuItem asChild>
                                      <button
                                        className={cn("w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none")}
                                        onClick={() => { setItemToEdit(child.raw); setIsCopying(false); setIsCreateSingleOpen(true); }}
                                      >
                                        <Pencil size={16} />
                                        <span>{tc('edit')}</span>
                                      </button>
                                    </DropdownMenuItem>}
                                    {productsServicesPermissions.add && <DropdownMenuItem asChild>
                                      <button
                                        className={cn("w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none")}
                                        onClick={() => { setItemToEdit(child.raw); setIsCopying(true); setIsCreateSingleOpen(true); }}
                                      >
                                        <IoCopyOutline size={16} />
                                        <span>{tc('copy')}</span>
                                      </button>
                                    </DropdownMenuItem>}
                                    {productsServicesPermissions.delete && <DropdownMenuItem asChild>
                                      <button
                                        className={cn("w-full flex items-center text-red-500 cursor-pointer text-sm gap-2 justify-start outline-none")}
                                        onClick={() => { setItemToDelete(child); }}
                                      >
                                        <Trash2 size={16} className='text-red-500' />
                                        <span>{tc('delete')}</span>
                                      </button>
                                    </DropdownMenuItem>}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    )
                  } else {
                    return (
                      <tr key={item.guid || index} className="hover:bg-neutral-50 border-b border-gray-200 text-sm">
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center">
                            <OperationCheckbox checked={selectedItems.has(item.guid)} onChange={() => handleSelectChild(item)} />
                          </div>
                        </td>
                        <td className="p-3 text-start font-medium text-neutral-700">{item.name || '—'}</td>
                        <td className="p-3 text-start font-normal text-xs  text-neutral-500">{item.type || '—'}</td>
                        <td className="p-3 text-start text-neutral-500">{item.artikul || '—'}</td>
                        <td className="p-3 text-end text-neutral-700">{item.price ? `${item.price.toLocaleString('ru-RU')} ${item.currency}` : '—'}</td>
                        <td className="p-3 text-center text-neutral-500">{item.unit}</td>
                        <td className="p-3 text-center text-neutral-500">{item.vat}</td>
                        <td className="p-3 text-end text-neutral-700">{item.priceWithVat ? `${item.priceWithVat.toLocaleString('ru-RU')} ${item.currency}` : '—'}</td>
                        <td className="p-3 text-start text-neutral-500 max-w-[160px] overflow-hidden text-overflow-ellipsis whitespace-nowrap">{item.comment || '—'}</td>
                        <td className="p-3 text-center w-10 " onClick={(e) => e.stopPropagation()}>
                          {(productsServicesPermissions.edit || productsServicesPermissions.delete || productsServicesPermissions.add) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <div className="p-1 hover:bg-neutral-200 cursor-pointer rounded-full inline-flex items-center justify-center">
                                  <MoreVertical size={16} />
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-40 p-2" align="end">
                                {productsServicesPermissions.edit && <DropdownMenuItem asChild>
                                  <button
                                    className={cn("w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none")}
                                    onClick={() => { setItemToEdit(item.raw); setIsCopying(false); setIsCreateSingleOpen(true); }}
                                  >
                                    <Pencil size={16} />
                                    <span>Редактировать</span>
                                  </button>
                                </DropdownMenuItem>}
                                {productsServicesPermissions.add && <DropdownMenuItem asChild>
                                  <button
                                    className={cn("w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start outline-none")}
                                    onClick={() => { setItemToEdit(item.raw); setIsCopying(true); setIsCreateSingleOpen(true); }}
                                  >
                                    <IoCopyOutline size={16} />
                                    <span>Копировать</span>
                                  </button>
                                </DropdownMenuItem>}
                                {productsServicesPermissions.delete && <DropdownMenuItem asChild>
                                  <button
                                    className={cn("w-full flex items-center text-red-500 cursor-pointer text-sm gap-2 justify-start outline-none")}
                                    onClick={() => { setItemToDelete(item); }}
                                  >
                                    <Trash2 size={16} className='text-red-500' />
                                    <span>{tc('delete')}</span>
                                  </button>
                                </DropdownMenuItem>}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    )
                  }
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="fixed bottom-0 left-[80px] py-4 px-3 right-0 bg-white border-t border-gray-200">
        <span className={' lowercase'}>
          {t('footer.total', { count: 3 })} 
        </span>
      </div>

      <CreateSingle
        open={isCreateSingleOpen}
        setOpen={(open) => {
          setIsCreateSingleOpen(open);
          if (!open) { setItemToEdit(null); setIsCopying(false); }
        }}

        initialData={itemToEdit}
        isEditing={!!itemToEdit && !isCopying}
      />

      <CreateGroup initialData={editGroup} open={isCreateGroupOpen} setOpen={() => setIsCreateGroupOpen(false)} />

      <CustomModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)}>
        <div className='flex flex-col gap-6 p-2'>
          <h2 className="text-xl font-bold text-neutral-900 font-sans">
            Удалить {itemToDelete?.isGroup ? "группу" : "товар"}
          </h2>
          <p className='text-sm text-neutral-600 leading-relaxed font-sans'>
            {itemToDelete?.isGroup
              ? `Вы действительно хотите удалить группу «${itemToDelete.name}»? Восстановить её будет невозможно.`
              : `Вы действительно хотите удалить товар «${itemToDelete?.name}»? Восстановить его будет невозможно.`
            }
          </p>
          <div className='flex justify-end items-center gap-6 mt-2'>
            <button
              onClick={() => setItemToDelete(null)}
              className='text-[#00A389] font-semibold text-sm hover:underline cursor-pointer'
            >
              Отменить
            </button>
            <button
              onClick={handleDeleteConfirm}
              className='px-6 py-2.5 text-sm font-semibold text-white bg-[#F04438] rounded-md hover:bg-[#D92D20] transition-colors cursor-pointer min-w-[100px]'
              disabled={isDeletingItem}
            >
              {isDeletingItem ? <Loader size={20} color='white' /> : 'Удалить'}
            </button>
          </div>
        </div>
      </CustomModal>

      <CustomModal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)}>
        <div className='flex flex-col gap-6 p-2'>
          <h2 className="text-xl font-bold text-neutral-900 font-sans">
            Удалить выбранные элементы?
          </h2>
          <p className='text-sm text-neutral-600 leading-relaxed font-sans'>
            Вы действительно хотите удалить {selectedItems.size} {selectedItems.size === 1 ? 'элемент' : 'элементов'}? Восстановить {selectedItems.size === 1 ? 'его' : 'их'} будет невозможно.
          </p>
          <div className='flex justify-end items-center gap-6 mt-2'>
            <button
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className='text-[#00A389] font-semibold text-sm hover:underline cursor-pointer'
            >
              Отменить
            </button>
            <button
              onClick={handleBulkDelete}
              className='px-6 py-2.5 text-sm font-semibold text-white bg-[#F04438] rounded-md hover:bg-[#D92D20] transition-colors cursor-pointer min-w-[100px]'
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? <Loader size={20} color='white' /> : 'Удалить'}
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Error Modal for Group Delete with Children */}
      <CustomModal isOpen={!!errorGroup} onClose={() => setErrorGroup(null)}>
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 9L9 15" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 9L15 15" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 font-sans">
              Ошибка удаления группы
            </h2>
          </div>
        </div>
        <p className="mb-7 text-sm text-neutral-600 leading-5 font-sans">
          К группе «<strong>{errorGroup?.name}</strong>» относятся товары/услуги. Чтобы удалить группу, переместите их в другую группу или удалите их.
        </p>
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              if (errorGroup?.guid) toggleGroup(errorGroup.guid);
              setErrorGroup(null);
            }}
            className="bg-transparent text-[#00A389] font-semibold text-sm hover:underline cursor-pointer"
          >
            Посмотреть элементы
          </button>
          <button
            onClick={() => setErrorGroup(null)}
            className="bg-[#00A389] text-white font-semibold text-sm px-5 py-2 rounded-md hover:bg-[#048F7C] cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </CustomModal>
    </>
  )
})
