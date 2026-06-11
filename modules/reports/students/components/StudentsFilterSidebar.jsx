import { FilterSection, FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import SelectCounterParties from '@/components/ReadyComponents/SelectCounterParties'
import SelectCounterPartyGroup from '@/components/ReadyComponents/SelectCounterPartyGroup'
import CustomRangeMonthPicker from '@/components/shared/CustomRangeMonthPicker'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { student } from '@/store/student.store'

const StudentsFilterSidebar = ({ t, isOpen, onClose, clearCount, onClear, onSubmit }) => (
  <FilterSidebar
    isOpen={isOpen}
    clearCount={clearCount}
    onClear={onClear}
    onClose={onClose}
  >
    <FilterSection title={t('common.date')}>
      <CustomRangeMonthPicker
        value={student.rangeMonth}
        handleSubmit={onSubmit}
        onChange={(months) => student.setState('rangeMonth', months)}
        range
      />
    </FilterSection>
    <FilterSection title={t('common.counterparty')}>
      <SelectCounterParties
        value={student.selectedCounterParties}
        onChange={(value) => student.setState('selectedCounterParties', value)}
      />
    </FilterSection>
    <FilterSection title={t('common.counterpartyGroup')}>
      <SelectCounterPartyGroup
        multi={true}
        value={student.selectedCounterPartiesGroups}
        onChange={(value) => student.setState('selectedCounterPartiesGroups', value)}
      />
    </FilterSection>
    <FilterSection title={t('students.statusTile')}>
      <SingleSelect
        data={[
          { value: 'active', label: t('students.status.active') },
          { value: 'passive', label: t('students.status.passive') }
        ]}
        value={student.status}
        onChange={(value) => student.setState('status', value)}
      />
    </FilterSection>
  </FilterSidebar>
)

export default StudentsFilterSidebar
