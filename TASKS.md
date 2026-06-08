# Dropdown Header Item Implementation Tasks

## Learning: How dropdownHeaderItem Works

### Pattern from SelectLegalEntities
```jsx
// 1. Accept dropdownHeaderItem as prop
const SelectLegelEntitties = ({ value, onChange, placeholder, ..., dropdownHeaderItem }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 2. Create default header (button to create new item)
  const createLegalEntityHeader = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors cursor-pointer border-b border-gray-100"
    >
      <Plus size={16} />
      {t('createLegalEntity')}
    </button>
  )

  // 3. Combine custom prop with default fallback
  const combinedHeaderItem = (
    <>
      {dropdownHeaderItem || createLegalEntityHeader}
    </>
  )

  // 4. Pass to Select component
  return (
    <>
      <Component
        ...
        dropdownHeaderItem={combinedHeaderItem}
      />
      <CreateLegalEntityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
```

### Key Principles:
1. **Accept `dropdownHeaderItem` prop** — allows parent to override header
2. **Create default header** — button with icon to open create modal
3. **Combine with fallback** — use custom prop or default
4. **Pass to Select component** — MultiSelect, SingleSelect, TreeSelect
5. **Include modal** — for creating new items

---

## Task 1: Create SelectCounterParties Component ✅ COMPLETED

**File**: `components/ReadyComponents/SelectCounterParties/index.jsx`

**Purpose**: Multi-select for counterparties with built-in create functionality
**Status**: Done ✅

**Based on**: SelectLegalEntities pattern + SingleCounterParty logic

**Key features**:
- Multi-select dropdown (not tree)
- Search/filter by name
- Default "Create Counterparty" header button
- Accepts custom `dropdownHeaderItem` override
- Opens CreateCounterpartyModal

**Props**:
```jsx
{
  value,           // array of guids
  onChange,        // (values: guid[]) => void
  placeholder,
  className,
  dropdownClassName,
  hasError,
  isClearable,
  disabled,
  dropdownHeaderItem  // custom header override
}
```

**Implementation steps**:
1. Use `useUcodeRequestQuery` with `get_counterparties_group` method
2. Flatten tree structure to simple options array
3. Create "Create Counterparty" button header with Plus icon
4. Combine with `dropdownHeaderItem` prop
5. Return MultiSelect + CreateCounterpartyModal

---

## Task 2: Implement SelectCounterParties in dropdownHeaderItem

**Goal**: Use SelectCounterParties where it makes sense with custom headers

**Example Use Case**: Operations Filter Sidebar, Deal Detail filters

**Pattern**:
```jsx
// In parent component that uses SelectCounterParties
const handleCreateCounterparty = (newId) => {
  // Optionally add to selected
  setSelectedCounterparties([...selectedCounterparties, newId])
}

const customHeader = (
  <button onClick={() => setShowCreateModal(true)} className="...">
    <Plus size={16} />
    Create & Add
  </button>
)

return (
  <SelectCounterParties
    value={selectedCounterparties}
    onChange={setSelectedCounterparties}
    dropdownHeaderItem={customHeader}
  />
)
```

---

## Task 3: Create SelectDeals (SingleZdelka) Component ✅ COMPLETED

**Status**: Done ✅

**File**: `components/ReadyComponents/SingleZdelka/index.jsx`

**Purpose**: Single-select for deals with built-in create functionality

**Based on**: SelectLegalEntities pattern + MultiZdelka logic

**Key features**:
- Single-select dropdown
- Search by deal name
- Default "Create Deal" header button
- Accepts custom `dropdownHeaderItem` override
- Opens CreateDealModal

**Implementation steps**:
1. Similar to MultiZdelka but use SingleSelect instead
2. Create "Create Deal" button header
3. Combine with `dropdownHeaderItem` prop
4. Return SingleSelect + CreateDealModal

---

## Task 4: Implement Deals in dropdownHeaderItem (MultiSelectZdelka) ✅ COMPLETED

**Goal**: Add create deal functionality to existing MultiZdelka
**Status**: Done ✅

**Changes to MultiZdelka**:
1. Add state for modal open/close
2. Create default "Create Deal" header button
3. Combine with passed `dropdownHeaderItem`
4. Add CreateDealModal

**Pattern**: Same as Task 2 but for MultiSelectZdelka

---

## Quick Checklist

### Task 1 Checklist:
- [ ] Create `SelectCounterParties/index.jsx`
- [ ] Import CreateCounterpartyModal
- [ ] Setup useUcodeRequestQuery with counterparty data
- [ ] Map tree data to flat options
- [ ] Create default header button
- [ ] Combine with dropdownHeaderItem
- [ ] Return MultiSelect + Modal
- [ ] Test with sample props

### Task 2 Checklist:
- [ ] Find components using SelectCounterParties
- [ ] Add custom dropdownHeaderItem where needed
- [ ] Test custom header appears correctly

### Task 3 Checklist:
- [ ] Create `SingleZdelka/index.jsx`
- [ ] Import CreateDealModal
- [ ] Setup useUcodeRequestQuery
- [ ] Create default header button
- [ ] Return SingleSelect + Modal

### Task 4 Checklist:
- [ ] Add modal state to MultiZdelka
- [ ] Add default header button
- [ ] Combine with dropdownHeaderItem
- [ ] Add CreateDealModal
- [ ] Test in operations/reports filters

---

## File References

**Existing Components**:
- `components/ReadyComponents/SelectLegelEntitties/index.jsx` — Pattern reference
- `components/ReadyComponents/SingleCounterParty/index.jsx` — Counterparty tree logic
- `components/ReadyComponents/MultiZdelka/index.jsx` — Multi-select deals
- `components/directories/CreateCounterpartyModal/CreateCounterpartyModal.jsx` — Create modal
- `components/deals/CreateDealModal/CreateDealModal.jsx` — Create modal

**To Create**:
- `components/ReadyComponents/SelectCounterParties/index.jsx` — NEW
- `components/ReadyComponents/SingleZdelka/index.jsx` — NEW

**To Modify**:
- `components/ReadyComponents/MultiZdelka/index.jsx` — Add modal + header
