export const CONTRACT_VARIABLE_GROUPS = [
  {
    key: "contract",
    items: [
      { key: "contractNumber" },
      { key: "contractDate" },
      { key: "contractEndDate" },
      { key: "academicYear" },
      { key: "validFrom" },
      { key: "validTo" },
    ],
  },
  {
    key: "student",
    items: [
      { key: "studentName", aliases: ["student"] },
      { key: "studentBirthday", aliases: ["birthDate"] },
      { key: "className", aliases: ["studentClass"] },
      { key: "gender" },
      { key: "language" },
    ],
  },
  {
    key: "guardian",
    items: [
      { key: "guardianName" },
      { key: "guardianType" },
      { key: "guardianPassport", aliases: ["passport"] },
      { key: "guardianPassportIssuedBy", aliases: ["issuedBy"] },
      { key: "guardianPinfl", aliases: ["pinfl"] },
      { key: "guardianPhone1", aliases: ["phone1"] },
      { key: "guardianPhone2", aliases: ["phone2"] },
      { key: "guardianAddress", aliases: ["address"] },
    ],
  },
  {
    key: "payment",
    items: [
      { key: "tariffName", aliases: ["tariff"] },
      { key: "monthlyPayment" },
      { key: "yearlyPayment" },
      { key: "chartOfAccounts" },
      { key: "legalEntity" },
    ],
  },
  {
    key: "org",
    items: [{ key: "branchName" }, { key: "clientType" }, { key: "status" }],
  },
];

/** Имя переменной → то, что попадает в шаблон: `${name}` */
export const toContractToken = (name) => `\${${name}}`;

export const CONTRACT_VARIABLES_COUNT = CONTRACT_VARIABLE_GROUPS.reduce(
  (total, group) => total + group.items.length,
  0
);
