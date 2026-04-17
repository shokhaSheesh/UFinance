import { appStore } from "../store/app.store";

export const GlobalCurrency = {
  get name() {
    return appStore.currency?.name || "";
  },
  get guid() {
    return appStore.currency?.guid || "";
  },
  get code() {
    return appStore.currency?.code || "";
  },
  valueOf() {
    return appStore.currency?.name || "";
  },
  toString() {
    return appStore.currency?.name || "";
  }
};

export const donoSchool = "0c3930cb-d530-4317-83d9-17092a742b1b"


export const currencyInfo = {
  ZAR: 'ZAR (Рэнд)',
  YER: 'YER (Йеменский риал)',
  XDR: 'XDR (СДР)',
  VND: 'VND (Донг)',
  VES: 'VES (Венесуэльский боливар)',
  UYU: 'UYU (Уругвайское песо)',
  AED: 'AED (Дирхам ОАЭ)',
  UAH: 'UAH (Гривна)',
  TRY: 'TRY (Турецкая лира)',
  TND: 'TND (Тунисский динар)',
  TMT: 'TMT (Новый туркменский манат)',
  TJS: 'TJS (Сомони)',
  THB: 'THB (Бат)',
  SYP: 'SYP (Сирийский фунт)',
  SGD: 'SGD (Сингапурский доллар)',
  SEK: 'SEK (Шведская крона)',
  SDG: 'SDG (Суданский фунт)',
  SAR: 'SAR (Саудовский риял)',
  AMD: 'AMD (Армянский драм)',
  RSD: 'RSD (Сербский динар)',
  RON: 'RON (Румынский лей)',
  QAR: 'QAR (Катарский риал)',
  PLN: 'PLN (Злотый)',
  PKR: 'PKR (Пакистанская рупия)',
  PHP: 'PHP (Филиппинское песо)',
  OMR: 'OMR (Оманский риал)',
  NZD: 'NZD (Новозеландский доллар)',
  NOK: 'NOK (Норвежская крона)',
  MYR: 'MYR (Малайзийский ринггит)',
  MXN: 'MXN (Мексиканское песо)',
  MNT: 'MNT (Монгольский тугpик)',
  MMK: 'MMK (Мьянманский кьят)',
  MDL: 'MDL (Молдавский лей)',
  MAD: 'MAD (Марокканский дирхам)',
  LYD: 'LYD (Ливийский динар)',
  LBP: 'LBP (Ливанский фунт)',
  LAK: 'LAK (Лаосский кип)',
  KZT: 'KZT (Казахстанский тенге)',
  KWD: 'KWD (Кувейтский динар)',
  KRW: 'KRW (Вона Республики Корея)',
  KHR: 'KHR (Риель)',
  KGS: 'KGS (Киргизский сом)',
  AUD: 'AUD (Австралийский доллар)',
  JOD: 'JOD (Иорданский динар)',
  ISK: 'ISK (Исландская крона)',
  IRR: 'IRR (Иранский риал)',
  IQD: 'IQD (Иракский динар)',
  INR: 'INR (Индийская рупия)',
  ILS: 'ILS (Новый израильский шекель)',
  IDR: 'IDR (Рупия)',
  HUF: 'HUF (Венгерский форинт)',
  HKD: 'HKD (Гонгконгский доллар)',
  GEL: 'GEL (Грузинский лари)',
  ARS: 'ARS (Аргентинское песо)',
  AFN: 'AFN (Афгани)',
  EGP: 'EGP (Египетский фунт)',
  DZD: 'DZD (Алжирский динар)',
  DKK: 'DKK (Датская крона)',
  CZK: 'CZK (Чешская крона)',
  CUP: 'CUP (Кубинское песо)',
  CNY: 'CNY (Юань ренминби)',
  CHF: 'CHF (Швейцарский франк)',
  CAD: 'CAD (Канадский доллар)',
  BYN: 'BYN (Белорусский рубль)',
  BRL: 'BRL (Бразильский реал)',
  BND: 'BND (Брунейский доллар)',
  BHD: 'BHD (Бахрейнский динар)',
  BGN: 'BGN (Болгарский лев)',
  BDT: 'BDT (Бангладешская така)',
  AZN: 'AZN (Азербайджанский манат)',
  JPY: 'JPY (Иена)',
  GBP: 'GBP (Фунт стерлингов)',
  EUR: 'EUR (Евро)',
  USD: 'USD (Доллар США)',
  RUB: 'RUB (Российский рубль)',
  UZS: 'UZS (Узбекский сум)',
}

export const data = [
  {
    "cbu_code": "710",
    "guid": "9378c582-c606-47b8-8dfb-3e4c59f76d0e",
    "icon": "R",
    "is_active": true,
    "kod": "ZAR",
    "nazvanie": "Рэнд",
    "payment_type": false
  },
  {
    "cbu_code": "886",
    "guid": "ff88f731-77ba-470f-b555-e13bf2a6cca5",
    "icon": "YER",
    "is_active": true,
    "kod": "YER",
    "nazvanie": "Йеменский риал",
    "payment_type": false
  },
  {
    "cbu_code": "960",
    "guid": "10b2b602-d85b-4aab-97b4-3ceeab26673c",
    "icon": "XDR",
    "is_active": true,
    "kod": "XDR",
    "nazvanie": "СДР",
    "payment_type": false
  },
  {
    "cbu_code": "704",
    "guid": "34890b20-fcb6-46c4-a6d5-464d5ec9ad0a",
    "icon": "₫",
    "is_active": true,
    "kod": "VND",
    "nazvanie": "Донг",
    "payment_type": false
  },
  {
    "cbu_code": "928",
    "guid": "5a2d41c8-2af1-4291-8898-9a61a93aec54",
    "icon": "VES",
    "is_active": true,
    "kod": "VES",
    "nazvanie": "Венесуэльский боливар",
    "payment_type": false
  },
  {
    "cbu_code": "858",
    "guid": "1ed12235-0a33-4925-b1ed-e71aa6659b7a",
    "icon": "UYU",
    "is_active": true,
    "kod": "UYU",
    "nazvanie": "Уругвайское песо",
    "payment_type": false
  },
  {
    "cbu_code": "784",
    "guid": "6d1b4a26-107a-4c23-8221-91870884452d",
    "icon": "AED",
    "is_active": true,
    "kod": "AED",
    "nazvanie": "Дирхам ОАЭ",
    "payment_type": false
  },
  {
    "cbu_code": "980",
    "guid": "8e891431-6c14-4c11-974c-fe0aeffa36b7",
    "icon": "₴",
    "is_active": true,
    "kod": "UAH",
    "nazvanie": "Гривна",
    "payment_type": false
  },
  {
    "cbu_code": "949",
    "guid": "85976678-9fac-4ff7-a05b-d8fa971b5495",
    "icon": "₺",
    "is_active": true,
    "kod": "TRY",
    "nazvanie": "Турецкая лира",
    "payment_type": false
  },
  {
    "cbu_code": "788",
    "guid": "d64717db-24c2-46f3-a988-8b04403e955a",
    "icon": "TND",
    "is_active": true,
    "kod": "TND",
    "nazvanie": "Тунисский динар",
    "payment_type": false
  },
  {
    "cbu_code": "934",
    "guid": "74aea139-8b55-4be4-a96e-ef03893ebe06",
    "icon": "TMT",
    "is_active": true,
    "kod": "TMT",
    "nazvanie": "Новый туркменский манат",
    "payment_type": false
  },
  {
    "cbu_code": "972",
    "guid": "8f671dd4-c050-4ec7-8081-10f7c29f39a2",
    "icon": "TJS",
    "is_active": true,
    "kod": "TJS",
    "nazvanie": "Сомони",
    "payment_type": false
  },
  {
    "cbu_code": "764",
    "guid": "d52b900c-828a-4f7e-a958-d0f258973d7c",
    "icon": "฿",
    "is_active": true,
    "kod": "THB",
    "nazvanie": "Бат",
    "payment_type": false
  },
  {
    "cbu_code": "760",
    "guid": "1a59df64-abc1-4f08-b402-1618a6f4659e",
    "icon": "SYP",
    "is_active": true,
    "kod": "SYP",
    "nazvanie": "Сирийский фунт",
    "payment_type": false
  },
  {
    "cbu_code": "702",
    "guid": "cbe7e52d-ff94-468b-9fe0-bb88573b853e",
    "icon": "S$",
    "is_active": true,
    "kod": "SGD",
    "nazvanie": "Сингапурский доллар",
    "payment_type": false
  },
  {
    "cbu_code": "752",
    "guid": "2965fa22-3293-493e-a5e7-6506a385fec1",
    "icon": "kr",
    "is_active": true,
    "kod": "SEK",
    "nazvanie": "Шведская крона",
    "payment_type": false
  },
  {
    "cbu_code": "938",
    "guid": "2dd0fd10-44f4-4cce-a489-f1067b4c0d90",
    "icon": "SDG",
    "is_active": true,
    "kod": "SDG",
    "nazvanie": "Суданский фунт",
    "payment_type": false
  },
  {
    "cbu_code": "682",
    "guid": "e1046291-452b-473d-99aa-5de60b0711c7",
    "icon": "SAR",
    "is_active": true,
    "kod": "SAR",
    "nazvanie": "Саудовский риял",
    "payment_type": false
  },
  {
    "cbu_code": "051",
    "guid": "cf57c299-5ba0-4d34-9967-b8c13c293094",
    "icon": "AMD",
    "is_active": true,
    "kod": "AMD",
    "nazvanie": "Армянский драм",
    "payment_type": false
  },
  {
    "cbu_code": "941",
    "guid": "38a554bb-11a6-4947-a36f-2f9f472cd92d",
    "icon": "RSD",
    "is_active": true,
    "kod": "RSD",
    "nazvanie": "Сербский динар",
    "payment_type": false
  },
  {
    "cbu_code": "946",
    "guid": "5445783e-7dfe-4153-bef3-a0b0c2ce7eba",
    "icon": "RON",
    "is_active": true,
    "kod": "RON",
    "nazvanie": "Румынский лей",
    "payment_type": false
  },
  {
    "cbu_code": "634",
    "guid": "578ff5e0-0738-4dc5-bfe6-e732218fd972",
    "icon": "QAR",
    "is_active": true,
    "kod": "QAR",
    "nazvanie": "Катарский риал",
    "payment_type": false
  },
  {
    "cbu_code": "985",
    "guid": "73de825a-a153-4000-83f9-26533e821b84",
    "icon": "zł",
    "is_active": true,
    "kod": "PLN",
    "nazvanie": "Злотый",
    "payment_type": false
  },
  {
    "cbu_code": "586",
    "guid": "1b8fd11b-012a-42b0-8502-d7aa0da7bcf7",
    "icon": "PKR",
    "is_active": true,
    "kod": "PKR",
    "nazvanie": "Пакистанская рупия",
    "payment_type": false
  },
  {
    "cbu_code": "608",
    "guid": "96b6fc7e-8c19-449f-9d32-acc60e872c1e",
    "icon": "₱",
    "is_active": true,
    "kod": "PHP",
    "nazvanie": "Филиппинское песо",
    "payment_type": false
  },
  {
    "cbu_code": "512",
    "guid": "677b75ca-3644-411a-af03-2ddd2ede2d43",
    "icon": "OMR",
    "is_active": true,
    "kod": "OMR",
    "nazvanie": "Оманский риал",
    "payment_type": false
  },
  {
    "cbu_code": "554",
    "guid": "5c363111-3c39-4985-be06-e314b7e72966",
    "icon": "NZ$",
    "is_active": true,
    "kod": "NZD",
    "nazvanie": "Новозеландский доллар",
    "payment_type": false
  },
  {
    "cbu_code": "578",
    "guid": "65e58a2d-8ac7-4d45-b9e5-ca2da477e4f3",
    "icon": "kr",
    "is_active": true,
    "kod": "NOK",
    "nazvanie": "Норвежская крона",
    "payment_type": false
  },
  {
    "cbu_code": "458",
    "guid": "b4fa12a7-6a6a-4fb9-90ca-71361eb0ec7b",
    "icon": "RM",
    "is_active": true,
    "kod": "MYR",
    "nazvanie": "Малайзийский ринггит",
    "payment_type": false
  },
  {
    "cbu_code": "484",
    "guid": "b63c278a-00fe-4689-95d7-e45dc9465c6c",
    "icon": "MX$",
    "is_active": true,
    "kod": "MXN",
    "nazvanie": "Мексиканское песо",
    "payment_type": false
  },
  {
    "cbu_code": "496",
    "guid": "b699076f-1d63-49e1-a153-bd4225f1bc07",
    "icon": "₮",
    "is_active": true,
    "kod": "MNT",
    "nazvanie": "Монгольский тугpик",
    "payment_type": false
  },
  {
    "cbu_code": "104",
    "guid": "b66fe0ff-90b3-4dd4-ad9f-b3d8a2990985",
    "icon": "MMK",
    "is_active": true,
    "kod": "MMK",
    "nazvanie": "Мьянманский кьят",
    "payment_type": false
  },
  {
    "cbu_code": "498",
    "guid": "82cbabf9-2455-4da1-a81f-f119fe2f03d9",
    "icon": "MDL",
    "is_active": true,
    "kod": "MDL",
    "nazvanie": "Молдавский лей",
    "payment_type": false
  },
  {
    "cbu_code": "504",
    "guid": "7cc8d443-d455-4ad4-82bd-9fc66124e7c7",
    "icon": "MAD",
    "is_active": true,
    "kod": "MAD",
    "nazvanie": "Марокканский дирхам",
    "payment_type": false
  },
  {
    "cbu_code": "434",
    "guid": "d9104060-6b92-4b10-96ff-250381cb745c",
    "icon": "LYD",
    "is_active": true,
    "kod": "LYD",
    "nazvanie": "Ливийский динар",
    "payment_type": false
  },
  {
    "cbu_code": "422",
    "guid": "a5206a70-9195-4545-bc0b-538254577fe7",
    "icon": "LBP",
    "is_active": true,
    "kod": "LBP",
    "nazvanie": "Ливанский фунт",
    "payment_type": false
  },
  {
    "cbu_code": "418",
    "guid": "9d1f258f-bb6d-4f4c-9062-fcf71d7fcb78",
    "icon": "LAK",
    "is_active": true,
    "kod": "LAK",
    "nazvanie": "Лаосский кип",
    "payment_type": false
  },
  {
    "cbu_code": "398",
    "guid": "da286c13-6a7c-4e6d-ad30-1a5a90f255e5",
    "icon": "₸",
    "is_active": true,
    "kod": "KZT",
    "nazvanie": "Казахстанский тенге",
    "payment_type": false
  },
  {
    "cbu_code": "414",
    "guid": "c66ef6e4-b242-4950-b09e-fd3c5a179bf3",
    "icon": "KWD",
    "is_active": true,
    "kod": "KWD",
    "nazvanie": "Кувейтский динар",
    "payment_type": false
  },
  {
    "cbu_code": "410",
    "guid": "5f3c36d2-42b9-4708-b5a1-edf359806f39",
    "icon": "₩",
    "is_active": true,
    "kod": "KRW",
    "nazvanie": "Вона Республики Корея",
    "payment_type": false
  },
  {
    "cbu_code": "116",
    "guid": "f8fa1079-2e86-4ef4-895b-e9440f25e582",
    "icon": "KHR",
    "is_active": true,
    "kod": "KHR",
    "nazvanie": "Риель",
    "payment_type": false
  },
  {
    "cbu_code": "417",
    "guid": "29897476-743f-4b9c-bf75-7f419c4b843d",
    "icon": "KGS",
    "is_active": true,
    "kod": "KGS",
    "nazvanie": "Киргизский сом",
    "payment_type": false
  },
  {
    "cbu_code": "036",
    "guid": "45b1e7c3-923b-4f8a-b676-c800fd6b270b",
    "icon": "A$",
    "is_active": true,
    "kod": "AUD",
    "nazvanie": "Австралийский доллар",
    "payment_type": false
  },
  {
    "cbu_code": "400",
    "guid": "ce83e966-1154-46d9-ac1a-f071e0c0fbad",
    "icon": "JOD",
    "is_active": true,
    "kod": "JOD",
    "nazvanie": "Иорданский динар",
    "payment_type": false
  },
  {
    "cbu_code": "352",
    "guid": "d0f602a2-4a7e-475d-b53b-4798e861192e",
    "icon": "ISK",
    "is_active": true,
    "kod": "ISK",
    "nazvanie": "Исландская крона",
    "payment_type": false
  },
  {
    "cbu_code": "364",
    "guid": "497421f8-5d80-49fa-afeb-c2037739aced",
    "icon": "IRR",
    "is_active": true,
    "kod": "IRR",
    "nazvanie": "Иранский риал",
    "payment_type": false
  },
  {
    "cbu_code": "368",
    "guid": "c6e8ef8f-8db4-45c4-9653-1e4066f4795b",
    "icon": "IQD",
    "is_active": true,
    "kod": "IQD",
    "nazvanie": "Иракский динар",
    "payment_type": false
  },
  {
    "cbu_code": "356",
    "guid": "dbd8ed5d-3a16-4ba7-85a2-717e9eb15b90",
    "icon": "₹",
    "is_active": true,
    "kod": "INR",
    "nazvanie": "Индийская рупия",
    "payment_type": false
  },
  {
    "cbu_code": "376",
    "guid": "cf1eacd7-a566-4ca1-ad3f-45beceee68c8",
    "icon": "₪",
    "is_active": true,
    "kod": "ILS",
    "nazvanie": "Новый израильский шекель",
    "payment_type": false
  },
  {
    "cbu_code": "360",
    "guid": "0b7bfdd8-ab09-42f6-8f77-6b5285043f42",
    "icon": "IDR",
    "is_active": true,
    "kod": "IDR",
    "nazvanie": "Рупия",
    "payment_type": false
  },
  {
    "cbu_code": "348",
    "guid": "8d765255-d4f7-4654-9a9c-b0af4f882a9e",
    "icon": "Ft",
    "is_active": true,
    "kod": "HUF",
    "nazvanie": "Венгерский форинт",
    "payment_type": false
  },
  {
    "cbu_code": "344",
    "guid": "a8ef5a34-cd9e-4fbc-8d48-3a37252ad26d",
    "icon": "HK$",
    "is_active": true,
    "kod": "HKD",
    "nazvanie": "Гонгконгский доллар",
    "payment_type": false
  },
  {
    "cbu_code": "981",
    "guid": "0199fe7d-d1e8-457e-8ace-adcc2a65379f",
    "icon": "₾",
    "is_active": true,
    "kod": "GEL",
    "nazvanie": "Грузинский лари",
    "payment_type": false
  },
  {
    "cbu_code": "032",
    "guid": "1a04cb7a-99ec-4537-b6cf-c68921d55dff",
    "icon": "ARS",
    "is_active": true,
    "kod": "ARS",
    "nazvanie": "Аргентинское песо",
    "payment_type": false
  },
  {
    "cbu_code": "971",
    "guid": "47fc26e5-4571-4aab-8cc3-dab141bb5625",
    "icon": "AFN",
    "is_active": true,
    "kod": "AFN",
    "nazvanie": "Афгани",
    "payment_type": false
  },
  {
    "cbu_code": "818",
    "guid": "71d3e4b6-e2e3-462d-a7c5-2d4ce141a050",
    "icon": "EGP",
    "is_active": true,
    "kod": "EGP",
    "nazvanie": "Египетский фунт",
    "payment_type": false
  },
  {
    "cbu_code": "012",
    "guid": "85caefb9-5b74-4b25-8d7b-aa4c0df73a76",
    "icon": "DZD",
    "is_active": true,
    "kod": "DZD",
    "nazvanie": "Алжирский динар",
    "payment_type": false
  },
  {
    "cbu_code": "208",
    "guid": "1b45e79d-44ad-4d76-9a4e-1bbdc347ff0b",
    "icon": "kr",
    "is_active": true,
    "kod": "DKK",
    "nazvanie": "Датская крона",
    "payment_type": false
  },
  {
    "cbu_code": "203",
    "guid": "032f0750-1051-4c96-88ac-40281ef26fab",
    "icon": "Kč",
    "is_active": true,
    "kod": "CZK",
    "nazvanie": "Чешская крона",
    "payment_type": false
  },
  {
    "cbu_code": "192",
    "guid": "104b0b14-3efe-4163-8dcc-db34ea6276d5",
    "icon": "CUP",
    "is_active": true,
    "kod": "CUP",
    "nazvanie": "Кубинское песо",
    "payment_type": false
  },
  {
    "cbu_code": "156",
    "guid": "48b854eb-7e8e-446d-8eb2-a9a743c7e027",
    "icon": "¥",
    "is_active": true,
    "kod": "CNY",
    "nazvanie": "Юань ренминби",
    "payment_type": false
  },
  {
    "cbu_code": "756",
    "guid": "adba1363-740b-4ea3-9042-82acd4385ae9",
    "icon": "CHF",
    "is_active": true,
    "kod": "CHF",
    "nazvanie": "Швейцарский франк",
    "payment_type": false
  },
  {
    "cbu_code": "124",
    "guid": "f24846fe-12a8-4b5b-b6cb-47959106a4c7",
    "icon": "C$",
    "is_active": true,
    "kod": "CAD",
    "nazvanie": "Канадский доллар",
    "payment_type": false
  },
  {
    "cbu_code": "933",
    "guid": "3e26138b-c7f4-49e8-b6cf-fa3668716539",
    "icon": "BYN",
    "is_active": true,
    "kod": "BYN",
    "nazvanie": "Белорусский рубль",
    "payment_type": false
  },
  {
    "cbu_code": "986",
    "guid": "f54ad5cd-caaa-446d-8168-5d2d3b525f87",
    "icon": "R$",
    "is_active": true,
    "kod": "BRL",
    "nazvanie": "Бразильский реал",
    "payment_type": false
  },
  {
    "cbu_code": "096",
    "guid": "3ed914ee-8c64-4c5c-9625-261eee3b074d",
    "icon": "BND",
    "is_active": true,
    "kod": "BND",
    "nazvanie": "Брунейский доллар",
    "payment_type": false
  },
  {
    "cbu_code": "048",
    "guid": "ea89dc3a-61fd-4a1d-a7ea-58d2c78de197",
    "icon": "BHD",
    "is_active": true,
    "kod": "BHD",
    "nazvanie": "Бахрейнский динар",
    "payment_type": false
  },
  {
    "cbu_code": "975",
    "guid": "9bdd7545-3832-4759-86a9-2570f8235ec2",
    "icon": "BGN",
    "is_active": true,
    "kod": "BGN",
    "nazvanie": "Болгарский лев",
    "payment_type": false
  },
  {
    "cbu_code": "050",
    "guid": "52d4ebdd-489e-410b-ab1a-da16b453c09e",
    "icon": "BDT",
    "is_active": true,
    "kod": "BDT",
    "nazvanie": "Бангладешская така",
    "payment_type": false
  },
  {
    "cbu_code": "944",
    "guid": "29132558-a7f3-4667-a2d2-c49271a9631f",
    "icon": "₼",
    "is_active": true,
    "kod": "AZN",
    "nazvanie": "Азербайджанский манат",
    "payment_type": false
  },
  {
    "cbu_code": "392",
    "guid": "56befe49-d753-4543-a4df-83f218d04276",
    "icon": "¥",
    "is_active": true,
    "kod": "JPY",
    "nazvanie": "Иена",
    "payment_type": false
  },
  {
    "cbu_code": "826",
    "guid": "a6890c69-510f-4402-bfaf-fe81eb434641",
    "icon": "£",
    "is_active": true,
    "kod": "GBP",
    "nazvanie": "Фунт стерлингов",
    "payment_type": false
  },
  {
    "cbu_code": "978",
    "guid": "6b4453b9-98ac-4e3c-8ae8-7fdc7174f448",
    "icon": "€",
    "is_active": true,
    "kod": "EUR",
    "nazvanie": "Евро",
    "payment_type": false
  },
  {
    "cbu_code": "840",
    "guid": "056665e6-41f0-4dca-9c3d-66d554b457fc",
    "icon": "$",
    "is_active": true,
    "kod": "USD",
    "nazvanie": "Доллар США",
    "payment_type": false
  },
  {
    "cbu_code": "643",
    "guid": "9b391ef7-22c7-4c94-b011-ff4e51957dd2",
    "icon": "₽",
    "is_active": true,
    "kod": "RUB",
    "nazvanie": "Российский рубль",
    "payment_type": false
  },
  {
    "guid": "31b10867-8169-464e-8d3f-e3bec976fdbb",
    "icon": "so'm",
    "is_active": true,
    "kod": "UZS",
    "nazvanie": "Узбекский сум",
    "payment_type": false
  }
]
