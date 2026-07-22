// Учебные годы для формы студента и фильтра сделок: 2020-2021 … 2039-2040
export const academicYears = Array.from({ length: 20 }, (_, i) => {
  const start = 2020 + i
  return { value: `${start}-${start + 1}`, label: `${start}-${start + 1}` }
})
