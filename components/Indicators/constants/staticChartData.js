// Static fallback data for Indicators charts when backend returns no data

export const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

// Profit chart static data
export const STATIC_PROFIT_DATA = {
  legend: MONTHS.map((m, i) => ({ key: `month_${i + 1}`, title: m })),
  rows: [
    {
      id: 'revenue',
      name: 'Доходы',
      totalValue: 12500000,
      values: {
        month_1: 800000, month_2: 950000, month_3: 1100000,
        month_4: 1050000, month_5: 1200000, month_6: 1150000,
        month_7: 1300000, month_8: 1250000, month_9: 1100000,
        month_10: 1000000, month_11: 950000, month_12: 900000
      }
    },
    {
      id: 'expenses',
      name: 'Расходы',
      totalValue: 8500000,
      values: {
        month_1: 600000, month_2: 700000, month_3: 750000,
        month_4: 720000, month_5: 800000, month_6: 780000,
        month_7: 850000, month_8: 820000, month_9: 750000,
        month_10: 700000, month_11: 680000, month_12: 650000
      }
    },
    {
      id: 'net-profit',
      name: 'Чистая прибыль',
      totalValue: 4000000,
      values: {
        month_1: 200000, month_2: 250000, month_3: 350000,
        month_4: 330000, month_5: 400000, month_6: 370000,
        month_7: 450000, month_8: 430000, month_9: 350000,
        month_10: 300000, month_11: 270000, month_12: 250000
      }
    },
    {
      id: 'dividends',
      name: 'Дивиденды',
      totalValue: 800000,
      values: {
        month_1: 0, month_2: 0, month_3: 0,
        month_4: 0, month_5: 80000, month_6: 0,
        month_7: 0, month_8: 0, month_9: 0,
        month_10: 0, month_11: 720000, month_12: 0
      }
    }
  ],
  netProfit: 4000000
}

// CashFlow chart static data
export const STATIC_CASHFLOW_DATA = {
  legend: MONTHS.map((m, i) => ({ key: `month_${i + 1}`, title: m })),
  rows: [
    {
      name: 'Операционный поток',
      details: [
        {
          name: 'Поступления',
          totalValue: 7200000,
          values: {
            month_1: 500000, month_2: 600000, month_3: 650000,
            month_4: 620000, month_5: 700000, month_6: 680000,
            month_7: 750000, month_8: 720000, month_9: 650000,
            month_10: 600000, month_11: 580000, month_12: 550000
          }
        },
        {
          name: 'Выплаты',
          totalValue: -4800000,
          values: {
            month_1: -350000, month_2: -400000, month_3: -420000,
            month_4: -410000, month_5: -450000, month_6: -440000,
            month_7: -480000, month_8: -460000, month_9: -420000,
            month_10: -400000, month_11: -380000, month_12: -360000
          }
        }
      ]
    },
    {
      name: 'Инвестиционный поток',
      details: [
        {
          name: 'Поступления',
          totalValue: 1500000,
          values: {
            month_1: 100000, month_2: 120000, month_3: 130000,
            month_4: 125000, month_5: 140000, month_6: 135000,
            month_7: 150000, month_8: 145000, month_9: 130000,
            month_10: 120000, month_11: 115000, month_12: 110000
          }
        },
        {
          name: 'Выплаты',
          totalValue: -2000000,
          values: {
            month_1: -150000, month_2: -180000, month_3: -190000,
            month_4: -185000, month_5: -200000, month_6: -195000,
            month_7: -210000, month_8: -205000, month_9: -190000,
            month_10: -180000, month_11: -175000, month_12: -170000
          }
        }
      ]
    },
    {
      name: 'Финансовый поток',
      details: [
        {
          name: 'Поступления',
          totalValue: 500000,
          values: {
            month_1: 40000, month_2: 45000, month_3: 50000,
            month_4: 48000, month_5: 55000, month_6: 52000,
            month_7: 58000, month_8: 56000, month_9: 50000,
            month_10: 46000, month_11: 44000, month_12: 42000
          }
        },
        {
          name: 'Выплаты',
          totalValue: -1200000,
          values: {
            month_1: -100000, month_2: -110000, month_3: -115000,
            month_4: -112000, month_5: -120000, month_6: -118000,
            month_7: -125000, month_8: -122000, month_9: -115000,
            month_10: -110000, month_11: -108000, month_12: -105000
          }
        }
      ]
    }
  ]
}

// AccountBalance chart static data
const today = new Date()
const generateDailyBalances = () => {
  const balances = []
  let currentBalance = 2500000

  for (let i = 0; i < 90; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - (89 - i))

    // Random fluctuation
    const change = Math.floor(Math.random() * 50000) - 25000
    currentBalance += change

    balances.push({
      date: date.toISOString().split('T')[0],
      totalInUserCurrency: currentBalance
    })
  }
  return balances
}

export const STATIC_ACCOUNT_BALANCE_DATA = [
  {
    account: { title: 'Основной счет' },
    totalValuesByDays: generateDailyBalances()
  },
  {
    account: { title: 'Резервный счет' },
    totalValuesByDays: generateDailyBalances().map(d => ({
      ...d,
      totalInUserCurrency: Math.floor(d.totalInUserCurrency * 0.3)
    }))
  }
]

// ProfitableClients chart static data
export const STATIC_PROFITABLE_CLIENTS_DATA = {
  counterparties80: [
    { name: 'ООО Альфа', summa: 2800000, percent: 35, percent_sum: 35 },
    { name: 'ООО Бета', summa: 2100000, percent: 26, percent_sum: 61 },
    { name: 'ИП Гамма', summa: 1500000, percent: 19, percent_sum: 80 },
    { name: 'ООО Дельта', summa: 800000, percent: 10, percent_sum: 90 },
  ],
  counterparties20: {
    name: 'Остальные',
    summa: 800000,
    percent: 10,
    percent_sum: 100
  }
}

// PaymentStructure - Income static data (for receipts_payments method)
export const STATIC_INCOME_CASHFLOW_DATA = {
  legend: MONTHS.map((m, i) => ({ key: `month_${i + 1}`, title: m })),
  rows: [
    {
      name: 'Операционный поток',
      details: [
        {
          name: 'Поступления',
          totalValue: 9200000,
          values: {
            month_1: 650000, month_2: 750000, month_3: 820000,
            month_4: 780000, month_5: 890000, month_6: 850000,
            month_7: 950000, month_8: 920000, month_9: 830000,
            month_10: 780000, month_11: 720000, month_12: 700000
          }
        }
      ]
    },
    {
      name: 'Инвестиционный поток',
      details: [
        {
          name: 'Поступления',
          totalValue: 1500000,
          values: {
            month_1: 100000, month_2: 120000, month_3: 130000,
            month_4: 125000, month_5: 140000, month_6: 135000,
            month_7: 150000, month_8: 145000, month_9: 130000,
            month_10: 120000, month_11: 115000, month_12: 110000
          }
        }
      ]
    },
    {
      name: 'Финансовый поток',
      details: [
        {
          name: 'Поступления',
          totalValue: 500000,
          values: {
            month_1: 40000, month_2: 45000, month_3: 50000,
            month_4: 48000, month_5: 55000, month_6: 52000,
            month_7: 58000, month_8: 56000, month_9: 50000,
            month_10: 46000, month_11: 44000, month_12: 42000
          }
        }
      ]
    }
  ]
}

// PaymentStructure - Expenses static data (for receipts_payments method)
export const STATIC_EXPENSES_CASHFLOW_DATA = {
  legend: MONTHS.map((m, i) => ({ key: `month_${i + 1}`, title: m })),
  rows: [
    {
      name: 'Операционный поток',
      details: [
        {
          name: 'Выплаты',
          totalValue: 6000000,
          values: {
            month_1: -450000, month_2: -520000, month_3: -550000,
            month_4: -530000, month_5: -580000, month_6: -560000,
            month_7: -620000, month_8: -600000, month_9: -550000,
            month_10: -520000, month_11: -490000, month_12: -470000
          }
        }
      ]
    },
    {
      name: 'Инвестиционный поток',
      details: [
        {
          name: 'Выплаты',
          totalValue: 2000000,
          values: {
            month_1: -150000, month_2: -180000, month_3: -190000,
            month_4: -185000, month_5: -200000, month_6: -195000,
            month_7: -210000, month_8: -205000, month_9: -190000,
            month_10: -180000, month_11: -175000, month_12: -170000
          }
        }
      ]
    },
    {
      name: 'Финансовый поток',
      details: [
        {
          name: 'Выплаты',
          totalValue: 1200000,
          values: {
            month_1: -100000, month_2: -110000, month_3: -115000,
            month_4: -112000, month_5: -120000, month_6: -118000,
            month_7: -125000, month_8: -122000, month_9: -115000,
            month_10: -110000, month_11: -108000, month_12: -105000
          }
        }
      ]
    }
  ]
}
