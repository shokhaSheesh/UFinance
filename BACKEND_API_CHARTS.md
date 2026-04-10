# Backend API Requirements - Indicators Charts

This document outlines the data structures required from the backend API for the Income, Expenses, and Profit indicator charts.

---

## Income Component

### Donut Chart (Income Breakdown)

**Endpoint:** `GET /api/indicators/income/donut`

**Response Structure:**
```json
{
  "donutData": [
    {
      "value": 250,
      "name": "Нераспределенный д",
      "color": "#3b82f6"
    }
  ],
  "totalIncome": 250
}
```

**Fields:**
- `donutData`: Array of income category objects
  - `value`: Number - amount in dollars
  - `name`: String - category name (Russian)
  - `color`: String - hex color code for the category
- `totalIncome`: Number - sum of all category values for center text display

---

### Bar Chart (Monthly Income)

**Endpoint:** `GET /api/indicators/income/monthly`

**Response Structure:**
```json
{
  "months": [
    "янв",
    "фев",
    "мар",
    "апр\n(факт)",
    "апр\n(план)",
    "май",
    "июн",
    "июл",
    "авг",
    "сен",
    "окт",
    "ноя",
    "дек"
  ],
  "monthlyIncome": [0, 0, 0, 1000, 50000, 0, 0, 0, 0, 0, 0, 0, 0]
}
```

**Fields:**
- `months`: Array of 13 month labels (Russian)
  - Note: "апр\n(план)" months receive special styling (dashed border, lighter color)
- `monthlyIncome`: Array of numbers - income amount for each month in dollars

---

## Expenses Component

### Donut Chart (Expense Breakdown)

**Endpoint:** `GET /api/indicators/expenses/donut`

**Response Structure:**
```json
{
  "donutData": [
    {
      "value": 100,
      "name": "Амортизация",
      "color": "#eab308"
    },
    {
      "value": 80,
      "name": "Нераспределенный р",
      "color": "#f97316"
    }
  ],
  "totalExpenses": 180
}
```

**Fields:**
- `donutData`: Array of expense category objects
  - `value`: Number - amount in dollars
  - `name`: String - category name (Russian)
  - `color`: String - hex color code for the category
- `totalExpenses`: Number - sum of all category values for center text display

---

### Bar Chart (Monthly Expenses - Stacked)

**Endpoint:** `GET /api/indicators/expenses/monthly`

**Response Structure:**
```json
{
  "months": [
    "янв",
    "фев",
    "мар",
    "апр\n(факт)",
    "апр\n(план)",
    "май",
    "июн",
    "июл",
    "авг",
    "сен",
    "окт",
    "ноя",
    "дек"
  ],
  "expenseCategories": {
    "amortization": [0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "otherExpenses": [0, 0, 0, 80, 180, 0, 0, 0, 0, 0, 0, 0, 0]
  }
}
```

**Fields:**
- `months`: Array of 13 month labels (Russian)
  - Note: "апр\n(план)" months receive special styling for stacked bars
- `expenseCategories`: Object with category keys
  - Each key maps to an array of monthly values in dollars
  - Categories are stacked vertically in the chart

---

## Profit Component

### Combined Chart (Income, Expenses, Net Profit, Dividends)

**Endpoint:** `GET /api/indicators/profit/chart`

**Response Structure:**
```json
{
  "months": [
    "янв",
    "фев",
    "мар",
    "апр",
    "апр\n(план)",
    "май",
    "июн",
    "июл",
    "авг",
    "сен",
    "окт",
    "ноя",
    "дек"
  ],
  "incomeData": [20000, 25000, 22000, 30000, 50000, 35000, 38000, 42000, 40000, 45000, 48000, 52000, 55000],
  "expenseData": [15000, 18000, 16000, 20000, 5000, 25000, 26000, 28000, 27000, 30000, 32000, 35000, 38000],
  "netProfitData": [5000, 7000, 6000, 10000, 45000, 10000, 12000, 14000, 13000, 15000, 16000, 17000, 17000],
  "dividendData": [0, 0, 0, 0, 0, 5000, 0, 0, 0, 0, 0, 0, 10000]
}
```

**Fields:**
- `months`: Array of 13 month labels (Russian)
- `incomeData`: Array of numbers - monthly income in dollars (displayed as bars)
- `expenseData`: Array of numbers - monthly expenses in dollars (displayed as bars)
- `netProfitData`: Array of numbers - calculated as (income - expense) for each month (displayed as dashed line)
- `dividendData`: Array of numbers - monthly dividend payments in dollars (displayed as solid line)

---

### Statistics Panel

**Endpoint:** `GET /api/indicators/profit/stats`

**Response Structure:**
```json
{
  "stats": [
    {
      "label": "Доходы",
      "value": "100",
      "plan": "50 793"
    },
    {
      "label": "Расходы",
      "value": "40",
      "plan": "180"
    },
    {
      "label": "Чистая прибыль",
      "value": "60",
      "plan": "50 613"
    },
    {
      "label": "Рентабельность, %",
      "value": "60%",
      "plan": "99.65%"
    },
    {
      "label": "Дивиденды",
      "value": "0",
      "plan": "0"
    }
  ]
}
```

**Fields:**
- `stats`: Array of statistic objects
  - `label`: String - metric name (Russian)
  - `value`: String - current value (formatted as needed)
  - `plan`: String - planned value (formatted as needed)

---

## General Notes

### Currency
- All monetary values are in dollars ($)

### Month Labels
- All month labels are in Russian
- Format: `янв`, `фев`, `мар`, `апр\n(факт)`, `апр\n(план)`, `май`, etc.
- Total of 13 months to accommodate both fact and plan versions for April

### Plan Months
- Months containing "план" (plan) receive special styling:
  - Dashed borders
  - Lighter/transparent colors
  - Used to distinguish planned vs actual values

### Colors
- Predefined color codes are used for consistency
- Backend should return these colors or frontend will apply defaults

### Percentages
- Donut chart percentages are calculated on frontend: `(value / total) * 100`
- Backend should not include percentage calculations in donut data

### Zoom Range
- Charts support zoom functionality via slider
- Zoom range is managed on frontend (0-100 percentage)
- No backend data needed for zoom functionality

---

## Color Reference

### Income Chart Colors
- Primary: `#3b82f6` (Blue)

### Expense Chart Colors
- Амортизация: `#eab308` (Yellow)
- Нераспределенный р: `#f97316` (Orange)

### Profit Chart Colors
- Доходы: `#38bdf8` (Cyan-blue)
- Расходы: `#fbab7e` (Orange)
- Чистая прибыль: `#10b981` (Green)
- Дивиденды: `#c084fc` (Purple)
