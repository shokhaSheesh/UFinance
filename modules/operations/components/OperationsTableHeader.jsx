// components/OperationsTableHeader.jsx
import { appStore } from '@/store/app.store'

/**
 * Sticky column header for the operations table.
 */
export default function OperationsTableHeader({ t }) {
  return (
    <div className="flex sticky top-0 z-30 text-sm font-medium text-neutral-500 items-center bg-neutral-50 border-b border-neutral-200">
      <div className="min-w-36 pl-5 flex p-3 items-center justify-start">
        {t('columns.date')}
      </div>
      <div className="min-w-18 max-w-52 flex-1 flex p-3 items-center justify-start">
        {t('columns.account')}
      </div>
      {appStore.isPayment && (
        <div className="min-w-14 flex p-3 items-center justify-center">
          {t('columns.paymentType')}
        </div>
      )}
      <div className="min-w-14 flex p-3 items-center justify-center">
        {t('columns.type')}
      </div>
      <div className="min-w-20 flex-1 flex p-3 items-center justify-start">
        {t('columns.counterparty')}
      </div>
      <div className="min-w-20 flex-1 text-start p-3 items-center justify-start">
        {t('columns.statya')}
      </div>
      {appStore.projectActive && (
        <div className="min-w-20 flex-1 flex p-3 items-center justify-start">
          {t('columns.project')}
        </div>
      )}
      <div className="min-w-20 flex-1 flex p-3 items-center justify-start">
        {t('columns.deal')}
      </div>
      <div className="min-w-36 flex p-3 items-center justify-end">
        {t('columns.amount')}
      </div>
      <div className="min-w-5 flex p-3 items-center justify-center">&nbsp;</div>
    </div>
  )
}
