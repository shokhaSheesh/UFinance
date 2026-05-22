import React from 'react'
import { formatAmount } from '@/utils/helpers'

export const ACCOUNT_FIELDS = [
  'nazvanie',
  'nachalьnyy_ostatok_val',
  'current_balance_val',
  'currenies_kod',
  "tip",
  "legal_entity_id",
  "requisites",
]

export const ACCOUNT_TABLE_HEADERS = [
  'tableHeaders.name',
  'tableHeaders.initialBalance',
  'tableHeaders.balance',
  'tableHeaders.currency',
  'tableHeaders.type',
  'tableHeaders.legalEntity',
  'tableHeaders.requisites',
]

export function formatAccountFieldValue(item, field) {
  const value = item[field]

  switch (field) {
    case 'nazvanie':
      return value || '–'
    case 'nomer_scheta':
      return value || '–'
    case 'current_balance_val':
      return typeof value === 'number' ? formatAmount(value) : '–'
    case 'nachalьnyy_ostatok_val':
      return formatAmount(value)
    case 'currenies_kod':
      return value || '–'
    case 'tip':
      return Array.isArray(value) ? value.join(', ') : value
    case 'data_sozdaniya':
      if (value) {
        const date = new Date(value)
        return date?.toLocaleDateString('ru-RU')
      }
      return '–'
    case 'currenies_id':
      return item.currenies_id_data
        ? `${item.currenies_id_data.kod || ''} (${item.currenies_id_data.nazvanie || ''})`.trim()
        : value
    case 'legal_entity_id':
      return item.legal_entity_id
        ? item.legal_entity_name || value
        : '–'
    case 'komentariy':
      if (typeof value === 'string') {
        return value.replace(/<[^>]*>/g, '').trim() || '–'
      }
      return value || '–'
    case 'requisites':
      const requisitesValue = (item?.tip?.[0] === "Безналичный" || item?.tip?.[0] === "Карта физлица") ? (
        <div className='flex flex-col'>
          <span className='text-xs'>{item?.bank_name}</span>
          <span className='text-xs'>{item?.nomer}</span>
        </div>
      ) : item?.tip?.[0] === 'Электронный' ? (
        <div className='flex flex-col'>
          <span className='text-xs'>{item?.nomer}</span>
        </div>
      ) : '–'
      if (typeof requisitesValue === 'string') {
        return requisitesValue.replace(/<[^>]*>/g, '').trim() || '–'
      }
      return requisitesValue || '–'
    default:
      if (value === null || value === undefined) return '–'
      return value
  }
}
