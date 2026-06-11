'use client'

import ScreenLoader from '@/components/shared/ScreenLoader'
import useMounted from '@/hooks/useMounted'
import FixedContent from '@/layouts/FixedContent'
import { student } from '@/store/student.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import StudentsBody from '../components/StudentsBody'
import StudentsFilterSidebar from '../components/StudentsFilterSidebar'
import StudentsHeader from '../components/StudentsHeader'
import StudentsTableHeader from '../components/StudentsTableHeader'
import { useStudentsData } from '../hooks/useStudentsData'

const StudentsPage = observer(() => {
  const t = useTranslations('Reports')
  const mounted = useMounted()
  const [open, setOpen] = useState(true)

  const accountingMethodOptions = useMemo(() => [
    { value: 'accrual', label: t('students.accounting.accrual') },
    { value: 'cash', label: t('students.accounting.cash') }
  ], [t])

  const {
    isScrolling, scrollRef, studentList, columns,
    isLoading, isFetching, isPending, isFetchingNextPage,
    handleContainerScroll, exportStudents, isStudentsExportLoading,
    clearCount, handleClearFilters, refetch
  } = useStudentsData(t)

  return (
    <FixedContent>
      {(isLoading || isFetching || isPending) && !isScrolling && <ScreenLoader />}
      {isFetchingNextPage && !isScrolling && <ScreenLoader />}

      <StudentsFilterSidebar
        t={t}
        isOpen={open}
        onClose={() => setOpen(prev => !prev)}
        clearCount={clearCount}
        onClear={handleClearFilters}
        onSubmit={() => refetch()}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative bg-white px-4">
        <StudentsHeader
          t={t}
          accountingMethodOptions={accountingMethodOptions}
          mounted={mounted}
          onExport={exportStudents}
          isExporting={isStudentsExportLoading}
          onAccountingChange={(value) => {
            student.setState('accounting', value)
            refetch()
          }}
        />

        <div ref={scrollRef} onScroll={handleContainerScroll} id="scrollableDiv" className="overflow-auto mb-5 relative">
          <div className="bg-white min-w-max">
            <StudentsTableHeader columns={columns} />
            <StudentsBody studentList={studentList} columns={columns} />
          </div>
        </div>
      </div>
    </FixedContent>
  )
})

export default StudentsPage
