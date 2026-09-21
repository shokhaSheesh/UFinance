'use client';

import CustomDatePicker from '@/components/shared/DatePicker';
import Input from '@/components/shared/Input';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUcodeRequestMutation } from '../../../hooks/useDashboard';
import { appStore } from '../../../store/app.store';
import { authStore } from '../../../store/auth.store';
import { formatDate } from '../../../utils/formatDate';
import SelectProjects from '../../ReadyComponents/SelectProjects';
import SingleCounterParty from '../../ReadyComponents/SingleCounterParty';
import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '../../shared/CustomDialog';
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
    if (isOpen) {
      if (!initialData) return;
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
      return;
    }

    // Чистим поля на закрытии, а не на открытии: эффекты детей выполняются
    // раньше родительских, поэтому сброс на открытии затирал значения,
    // которые селекты успевают подставить по умолчанию (например, проект)
    setDealName('');
    setDealDate('');
    setClient('');
    setProject('');
    setNds('true');
    setComment('');
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
    <CustomDialog open={isOpen} onClose={onClose} contentClass="w-[600px]">
      <form id="create-deal-form" className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
        <DialogHeader
          title={isPurchase
            ? (isEditing ? tp('titleEdit') : tp('titleNew'))
            : (isEditing ? t('titleEdit') : t('titleNew'))}
          onClose={onClose}
        />

        <DialogBody className="flex flex-col gap-4">
          <FormRow label={t('dealName')} error={errors.dealName}>
            <Input
              type="text"
              placeholder={t('dealNamePlaceholder')}
              value={dealName}
              onChange={(e) => {
                setDealName(e.target.value)
                if (errors.dealName) setErrors(prev => ({ ...prev, dealName: '' }))
              }}
              error={!!errors.dealName}
            />
          </FormRow>

          <FormRow label={t('dealDate')}>
            <CustomDatePicker
              value={dealDate}
              onChange={(val) => setDealDate(val)}
              placeholder={t('dealDatePlaceholder')}
              format="YYYY-MM-DD"
              className="w-full"
            />
          </FormRow>

          <FormRow label={isPurchase ? tp('supplier') : t('client')}>
            <SingleCounterParty
              value={client}
              onChange={value => setClient(value)}
              placeholder={isPurchase ? tp('supplierPlaceholder') : t('clientPlaceholder')}
              className={'bg-white'}
            />
          </FormRow>

          {/* Проект — только если включён модуль проектов */}
          {appStore.projectActive && (
            <FormRow label={t('project')}>
              <SelectProjects
                value={project}
                onChange={(value) => setProject(value)}
                placeholder={t('projectPlaceholder')}
                className={'bg-white'}
                selectFirst={!isEditing && !initialData}
              />
            </FormRow>
          )}

          {!isPurchase && (
            <FormRow label={t('vat')}>
              <SingleSelect
                data={ndsOptions}
                value={nds}
                onChange={(val) => setNds(val || '')}
                withSearch={false}
                placeholder={t('vatPlaceholder')}
                className={'bg-white'}
                isClearable={false}
              />
            </FormRow>
          )}

          <FormRow label={t('comment')} align="start">
            <TextArea value={comment} onChange={(e) => setComment(e.target.value)} />
          </FormRow>
        </DialogBody>

        <DialogFooter>
          <button type="button" className="secondary-btn h-9" onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="submit" form="create-deal-form" className="primary-btn">
            {isCreatingDeal ? <Loader /> : (isEditing ? t('save') : t('create'))}
          </button>
        </DialogFooter>
      </form>
    </CustomDialog>
  );
}
