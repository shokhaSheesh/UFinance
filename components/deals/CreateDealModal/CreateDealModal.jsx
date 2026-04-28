'use client';

import CustomDatePicker from '@/components/shared/DatePicker';
import Input from '@/components/shared/Input';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUcodeRequestMutation } from '../../../hooks/useDashboard';
import { appStore } from '../../../store/app.store';
import { formatDate } from '../../../utils/formatDate';
import SingleCounterParty from '../../ReadyComponents/SingleCounterParty';
import Loader from '../../shared/Loader';
import SingleSelect from '../../shared/Selects/SingleSelect';
import TextArea from '../../shared/TextArea';
import styles from './CreateDealModal.module.scss';

const ndsOptions = [
  { value: 'true', label: 'С учетом НДС' },
  { value: 'false', label: 'Без учета НДС' }
];

export function CreateDealModal({ isOpen, onClose, initialData, isEditing }) {
  const [dealName, setDealName] = useState('');
  const [dealDate, setDealDate] = useState();
  const [client, setClient] = useState('');
  const [nds, setNds] = useState('true');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  // const router = useRouter();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && initialData) {
      // eslint-disable-next-line
      setDealName(initialData.Nazvanie || initialData.name || '');
      const dateVal = initialData.Data_sdelki || initialData.sale_date;
      setDealDate(dateVal ? formatDate(dateVal) : '');
      setClient(initialData.partners_id || initialData.counterparties_id || '');
      const ndsVal = initialData.NDS !== undefined ? initialData.NDS : initialData.nds;
      setNds(ndsVal ? 'true' : 'false');
      setComment(initialData.Kommentariy || initialData.commentary || '');
    } else if (isOpen && !initialData) {
      setDealName('');
      setDealDate('');
      setClient('');
      setNds('true');
      setComment('');
    }
  }, [isOpen, initialData]);

  const { mutateAsync: createDeal, isPending: isCreatingDeal } = useUcodeRequestMutation()


  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!dealName.trim()) {
      newErrors.dealName = 'Название сделки обязательно';
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
      nds: nds === 'true',
      commentary: comment,
      currenies_id: appStore?.currency?.guid,
      status: ["Новая"]
    };

    if (isEditing && initialData?.guid) {
      payload.guid = initialData.guid;
    }

    try {
      await createDeal({
        method: isEditing ? 'update_sales_transaction' : 'create_sales_transaction',
        data: payload
      });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['get_sales_list_simple'] });
      queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] });
      onClose();

      // Navigate to the Deal detail page
      if (response?.data?.data?.guid) {
        router.push(`/pages/deals/${response.data.data.guid}`);
      } else if (isEditing && initialData?.guid) {
        // Fallback for edit if response lacks guid
        router.push(`/pages/deals/${initialData.guid}`);
      }
    } catch (error) {
      console.error('Error creating/updating deal:', error);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? 'Редактирование продажи' : 'Новая продажа'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X />
          </button>
        </div>

        <form id="create-deal-form" className="space-y-3 p-5 text-sm font-normal" onSubmit={handleSubmit}>
          <div className="grid grid-cols-7">
            <label className=" col-span-2 flex items-center">Название сделки</label>
            <div className=" col-span-5">
              <Input
                type="text"
                placeholder="Например, разработка сайта"
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
            <label className=" col-span-2 flex items-center">Дата сделки</label>
            <div className=" col-span-5">
              <CustomDatePicker
                value={dealDate}
                onChange={(val) => setDealDate(val)}
                placeholder="Выберите дату"
                format="YYYY-MM-DD"
                className={styles.datePicker}
              />
            </div>
          </div>

          <div className="grid grid-cols-7">
            <label className=" col-span-2 flex items-center">Клиент</label>
            <div className=" col-span-5">
              <SingleCounterParty
                value={client}
                onChange={value => setClient(value)}
                placeholder="Укажите кому падаете товар или услугу"
                className={'bg-white'}
              />
            </div>
          </div>

          <div className="grid grid-cols-7">
            <label className=" col-span-2 flex items-center"> НДС </label>
            <div className=" col-span-5">
              <SingleSelect
                data={ndsOptions}
                value={nds}
                onChange={(val) => setNds(val || '')}
                withSearch={false}
                placeholder="Выберите опцию"
                className={'bg-white'}
                isClearable={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-7">
            <label className=" col-span-2 flex items-center"> Комментарий </label>
            <div className=" col-span-5">
              <TextArea value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
          </div>
        </form>

        <div className={styles.footer}>
          <button type="button" className="secondary-btn" onClick={onClose}>
            Отменить
          </button>
          <button type="submit" form="create-deal-form" className="primary-btn">
            {isCreatingDeal ? <Loader /> : (isEditing ? 'Сохранить' : 'Создать')}
          </button>
        </div>
      </div>
    </div>
  );
}
