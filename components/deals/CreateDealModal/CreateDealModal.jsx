'use client';

import CustomDatePicker from '@/components/shared/DatePicker';
import Input from '@/components/shared/Input';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUcodeRequestMutation } from '../../../hooks/useDashboard';
import { appStore } from '../../../store/app.store';
import { authStore } from '../../../store/auth.store';
import { formatDate } from '../../../utils/formatDate';
import SelectProjects from '../../ReadyComponents/SelectProjects';
import SingleCounterParty from '../../ReadyComponents/SingleCounterParty';
import CustomDialog from '../../shared/CustomDialog';
import Loader from '../../shared/Loader';
import SingleSelect from '../../shared/Selects/SingleSelect';
import TextArea from '../../shared/TextArea';

export function CreateDealModal({ isOpen, onClose, initialData, isEditing, createMethod = 'create_sales_transaction', updateMethod = 'update_sales_transaction', invalidateKeys = ['deals', 'get_sales_list_simple', 'get_sales_transaction_by_guid'], redirectBase = '/deals', isPurchase = false, onCreated }) {
  const t = useTranslations('Deals.createDealModal');
  const tp = useTranslations('Purchases.createDealModal');

  const ndsOptions = [
    { value: 'true', label: t('vatWith') },
    { value: 'false', label: t('vatWithout') }
  ];

  const [dealName, setDealName] = useState('');
  const [dealDate, setDealDate] = useState();
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [nds, setNds] = useState('true');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && initialData) {
      // eslint-disable-next-line
      setDealName(initialData.Nazvanie || initialData.name || '');
      const dateVal = initialData.Data_sdelki || initialData.sale_date;
      setDealDate(dateVal ? formatDate(dateVal) : '');
      setClient(initialData.partners_id || initialData.counterparties_id || '');
      // autofill проекта, если он приходит в данных сделки
      setProject(initialData.projects_id || '');
      const ndsVal = initialData.NDS !== undefined ? initialData.NDS : initialData.nds;
      setNds(ndsVal ? 'true' : 'false');
      setComment(initialData.Kommentariy || initialData.commentary || '');
    } else if (isOpen && !initialData) {
      setDealName('');
      setDealDate('');
      setClient('');
      setProject('');
      setNds('true');
      setComment('');
    }
  }, [isOpen, initialData]);

  const { mutateAsync: createDeal, isPending: isCreatingDeal } = useUcodeRequestMutation()


  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!dealName.trim()) {
      newErrors.dealName = t('dealNameRequired');
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const today = new Date()
    let formattedDate = dealDate || formatDate(today);

    const payload = {
      deal_date: formattedDate,
      name: dealName,
      counterparties_id: client || null,
      commentary: comment,
      currenies_id: appStore?.currency?.guid,
      status: ["Новая"],
      branch_id: authStore.branch_id,
      ...(appStore.projectActive ? { projects_id: project || null } : {}),
    };

    if (!isPurchase) {
      payload.nds = nds === 'true';
    }

    if (isEditing && initialData?.guid) {
      payload.guid = initialData.guid;
    }

    try {
      const response = await createDeal({
        method: isEditing ? updateMethod : createMethod,
        data: payload
      });
      invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));

      const resultGuid = response?.data?.data?.guid || (isEditing ? initialData?.guid : null);
      onClose();

      // Inline-select rejimi: sahifaga o'tmaymiz — yangi sделка'ni tanlab, ochiq modalda qolamiz
      if (onCreated) {
        if (resultGuid) onCreated({ guid: resultGuid, name: dealName });
        return;
      }

      // Navigate to the detail page (deals/purchases ro'yxatidan ochilganda)
      if (response?.data?.data?.guid) {
        router.push(`${redirectBase}/${response.data.data.guid}`);
      } else if (isEditing && initialData?.guid) {
        router.push(`${redirectBase}/${initialData.guid}`);
      }
    } catch (error) {
      console.error('Error creating/updating deal:', error);
    }
  };

  return (
    <CustomDialog open={isOpen} onClose={onClose} contentClass="min-w-[600px]! max-w-[600px] p-0 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
        <h2 className="font-sans font-semibold text-lg leading-7 text-gray-900 m-0">
          {isPurchase
            ? (isEditing ? tp('titleEdit') : tp('titleNew'))
            : (isEditing ? t('titleEdit') : t('titleNew'))}
        </h2>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 cursor-pointer"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form id="create-deal-form" className="space-y-3 p-5 text-sm font-normal overflow-y-auto flex-1" onSubmit={handleSubmit}>
        <div className="grid grid-cols-7">
          <label className=" col-span-2 flex items-center">{t('dealName')}</label>
          <div className=" col-span-5">
            <Input
              type="text"
              placeholder={t('dealNamePlaceholder')}
              value={dealName}
              onChange={(e) => {
                setDealName(e.target.value);
                if (errors.dealName) setErrors(prev => ({ ...prev, dealName: '' }));
              }}
              error={!!errors.dealName}
            />
            {errors.dealName && (
              <p className="text-red-500 text-xs mt-1">{errors.dealName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7">
          <label className=" col-span-2 flex items-center">{t('dealDate')}</label>
          <div className=" col-span-5">
            <CustomDatePicker
              value={dealDate}
              onChange={(val) => setDealDate(val)}
              placeholder={t('dealDatePlaceholder')}
              format="YYYY-MM-DD"
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-7">
          <label className=" col-span-2 flex items-center">{isPurchase ? tp('supplier') : t('client')}</label>
          <div className=" col-span-5">
            <SingleCounterParty
              value={client}
              onChange={value => setClient(value)}
              placeholder={isPurchase ? tp('supplierPlaceholder') : t('clientPlaceholder')}
              className={'bg-white'}
            />
          </div>
        </div>

        {/* Проект — только если включён модуль проектов */}
        {appStore.projectActive && (
          <div className="grid grid-cols-7">
            <label className=" col-span-2 flex items-center">{t('project')}</label>
            <div className=" col-span-5">
              <SelectProjects
                value={project}
                onChange={(value) => setProject(value)}
                placeholder={t('projectPlaceholder')}
                className={'bg-white'}
              />
            </div>
          </div>
        )}

        {!isPurchase && (
          <div className="grid grid-cols-7">
            <label className=" col-span-2 flex items-center">{t('vat')}</label>
            <div className=" col-span-5">
              <SingleSelect
                data={ndsOptions}
                value={nds}
                onChange={(val) => setNds(val || '')}
                withSearch={false}
                placeholder={t('vatPlaceholder')}
                className={'bg-white'}
                isClearable={false}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-7">
          <label className=" col-span-2 flex items-center">{t('comment')}</label>
          <div className=" col-span-5">
            <TextArea value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
        <button
          type="button"
          className="min-w-[102px] h-10 rounded-lg border border-gray-300 px-4 py-2 bg-white font-sans font-semibold text-sm text-gray-700 cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400"
          onClick={onClose}
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          form="create-deal-form"
          className="min-w-[102px] h-10 rounded-lg border border-blue-700 px-4 py-2 bg-blue-700 font-sans font-semibold text-sm text-white cursor-pointer transition-all hover:bg-blue-800 hover:border-blue-800 flex items-center justify-center"
        >
          {isCreatingDeal ? <Loader /> : (isEditing ? t('save') : t('create'))}
        </button>
      </div>
    </CustomDialog>
  );
}
