import { cn } from "@/lib/utils";
import { keepPreviousData } from "@tanstack/react-query";
import { TrashIcon, X } from "lucide-react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import moment from "moment";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { GlobalCurrency } from "../../../../constants/globalCurrency";
import {
  useUcodeRequestMutation,
  useUcodeRequestQuery,
} from "../../../../hooks/useDashboard";
import { useOperationComments } from "../../../../hooks/useOperationComments";
import { productServiceDto } from "../../../../lib/dtos/productServiceDto";
import { queryClient } from "../../../../lib/queryClient";
import { appStore } from "../../../../store/app.store";
import {
  formatDecimal,
  formatNumber,
  StringtoNumber,
} from "../../../../utils/helpers";
import SentMessages from "../../../operations/OperationModal/SentMessages";
import MyAccountCurrensies from "../../../ReadyComponents/MyAccountCurrensies";
import SelectLegelEntitties from "../../../ReadyComponents/SelectLegelEntitties";
import SelectProductService from "../../../ReadyComponents/SelectProductService";
import SingleCounterParty from "../../../ReadyComponents/SingleCounterParty";
import SinglSelectStatiya from "../../../ReadyComponents/SingleSelectStatiya";
import OperationCheckbox from "../../../shared/Checkbox/operationCheckbox";
import FormDatepicker from "../../../shared/DatePicker/form-datepicker";
import Loader from "../../../shared/Loader";
import styles from "./style.module.scss";

const CreateShipment = observer(
  ({
    open,
    onClose,
    dealName,
    dealGuid,
    kontragentId,
    initialData = null,
    isEditing = false,
    isCopying = false,
    onSuccess,
    createMethod = "create_shipment_transaction",
    updateMethod = "update_shipment_transaction",
    getMethod = "get_shipment_transaction",
    dealIdField = "sales_id",
    operationType = ["Отгрузка"],
    invalidateKeys = [
      "get_sales_transaction_by_guid",
      "list_sales_operations",
      "find_operations",
    ],
    allowedTypes,
    isPurchase = false,
  }) => {
    const t = useTranslations("Deals.createShipment");
    const tp = useTranslations("Purchases.createSupply");
    // Same modal is reused for a sale's "Отгрузка" and a purchase's "Поставка" —
    // only these labels diverge between the two contexts.
    const L = isPurchase
      ? {
          titleNew: tp("titleNew"),
          titleEdit: tp("titleEdit"),
          shipmentDate: tp("supplyDate"),
          plannedShipment: tp("plannedSupply"),
          client: tp("supplier"),
          clientRequired: tp("supplierRequired"),
          incomeArticle: tp("expenseArticle"),
          undistributedIncome: tp("undistributedExpense"),
          removeFromShipment: tp("removeFromSupply"),
          shipmentSum: tp("supplySum"),
          products: tp("products"),
        }
      : {
          titleNew: t("titleNew"),
          titleEdit: t("titleEdit"),
          shipmentDate: t("shipmentDate"),
          plannedShipment: t("plannedShipment"),
          client: t("client"),
          clientRequired: t("clientRequired"),
          incomeArticle: t("incomeArticle"),
          undistributedIncome: t("undistributedIncome"),
          removeFromShipment: t("removeFromShipment"),
          shipmentSum: t("shipmentSum"),
          products: t("products"),
        };
    const today = useMemo(() => new Date(), []);

    const [shipmentDate, setShipmentDate] = useState(
      today.toISOString().split("T")[0]
    );
    const isFutureDate =
      new Date(shipmentDate).setHours(0, 0, 0, 0) > today.setHours(0, 0, 0, 0);

    const [isPlanned, setIsPlanned] = useState(true);
    const [legalEntity, setLegalEntity] = useState("");
    const [client, setClient] = useState(kontragentId || "");
    const [chartOfAccounts, setChartOfAccounts] = useState([]);
    const [currency, setCurrency] = useState("");
    const [showChartOfAccounts, setShowChartOfAccounts] = useState(true);
    const [rows, setRows] = useState([
      {
        id: 1,
        name: "",
        quantity: "",
        price: "",
        discount: "",
        nds: "",
        sum: "",
      },
    ]);
    const [code, setCode] = useState("");
    const isNewShipment = !isEditing;
    const comments = useOperationComments({
      isNew: isNewShipment,
      operationId: isEditing ? initialData?.guid : undefined,
    });
    const { data: SingleShipment, isPending: isGettingSingleShipment } =
      useUcodeRequestQuery({
        method: getMethod,
        data: {
          guid: initialData?.guid,
        },
        querySetting: {
          select: (response) => response?.data,
          placeholder: keepPreviousData,
        },
        skip: !initialData?.guid,
      });

    useEffect(() => {
      if (open && SingleShipment) {
        setShipmentDate(
          moment.parseZone(SingleShipment.data_nachislenie).format("YYYY-MM-DD")
        );
        setIsPlanned(
          (isPurchase
            ? SingleShipment.planned_supply
            : SingleShipment.planned_shipment) || false
        );
        setLegalEntity(SingleShipment.legal_entity_id || "");
        setClient(SingleShipment.partners_id || kontragentId || "");
        setChartOfAccounts(SingleShipment.chart_of_accounts_id || "");
        setCurrency(
          SingleShipment.currencies_id ||
            SingleShipment.currencyId ||
            GlobalCurrency.guid
        );

        const currencies = toJS(appStore.currencies);
        const icon = currencies?.find(
          (item) => item.guid === SingleShipment.currencies_id
        )?.icon;
        setCode(icon || "");

        if (SingleShipment.product_and_service_data) {
          setRows(
            SingleShipment.product_and_service_data.map((row, idx) => ({
              id: idx + 1,
              row_guid: row.guid,
              name: row.product_and_service_id || "",
              naimenovanie: row.Naimenovanie || "",
              artikul: row.Artikul || "",
              quantity: row.Kol_vo ?? 0,
              price: row.TSena_za_ed ?? 0,
              discount: String(row.Skidka ?? ""),
              nds: String(row.NDS ?? ""),
              sum: row.Summa ?? 0,
            }))
          );
        }
      } else if (open && !initialData?.guid) {
        setShipmentDate(today.toISOString().split("T")[0]);
        setIsPlanned(true);
        setLegalEntity("");
        setClient(kontragentId || "");
        setChartOfAccounts([]);
        setCurrency("");
        setCode("");
        setRows([
          {
            id: 1,
            name: "",
            quantity: "",
            price: "",
            discount: "",
            nds: "",
            sum: "",
          },
        ]);
        setSelectedProducts(new Set());
        setErrors({});
      }
    }, [open, SingleShipment, kontragentId, today, initialData?.guid || null]);

    const [selectedProducts, setSelectedProducts] = useState(new Set());

    const [errors, setErrors] = useState({});

    // Fetch legal entities data

    const { mutateAsync: createShipment, isPending: isCreating } =
      useUcodeRequestMutation();

    const { data: productServices } = useUcodeRequestQuery({
      method: "list_products_and_services",
      querySetting: {
        select: (data) => data?.data?.data,
      },
    });

    const productServicesList = useMemo(() => {
      return productServiceDto(productServices);
    }, [productServices]);

    const addRow = () => {
      setRows((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: "",
          quantity: "",
          price: "",
          discount: "",
          nds: "",
          sum: "",
        },
      ]);
    };

    const updateRow = (id, field, value) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row;
          const updated = { ...row, [field]: value };

          if (["quantity", "price", "discount", "nds"].includes(field)) {
            // sum = qty * price * (1 - discount/100) * (1 + nds/100)
            const q =
              Number(updated.quantity?.toString().replace(/\s/g, "")) || 0;
            const p = Number(updated.price?.toString().replace(/\s/g, "")) || 0;
            const d =
              Number(updated.discount?.toString().replace(/\s/g, "")) || 0;
            const n = Number(updated.nds?.toString().replace(/\s/g, "")) || 0;
            const subtotal = q * p;
            const afterDiscount = subtotal * (1 - d / 100);
            updated.sum = afterDiscount * (1 + n / 100);
          }

          if (field === "sum") {
            // Back-calculate price from sum: price = sum / qty / (1 - d/100) / (1 + n/100)
            const rawSum = Number(value?.toString().replace(/\s/g, "")) || 0;
            const q =
              Number(updated.quantity?.toString().replace(/\s/g, "")) || 0;
            const d =
              Number(updated.discount?.toString().replace(/\s/g, "")) || 0;
            const n = Number(updated.nds?.toString().replace(/\s/g, "")) || 0;
            if (q > 0) {
              const discountFactor = 1 - d / 100;
              const ndsFactor = 1 + n / 100;
              const divisor =
                q *
                (discountFactor > 0 ? discountFactor : 1) *
                (ndsFactor || 1);
              updated.price = divisor ? rawSum / divisor : 0;
            }
          }

          return updated;
        })
      );
    };

    const totalSum = useMemo(() => {
      return rows.reduce((acc, row) => {
        const sumVal = Number(row.sum?.toString().replace(/\s/g, "")) || 0;
        return formatDecimal(acc + sumVal);
      }, 0);
    }, [rows]);

    const handleCreate = async () => {
      const newErrors = {};
      if (!shipmentDate) newErrors.shipmentDate = t("shipmentDateRequired");
      if (!legalEntity) newErrors.legalEntity = t("legalEntityRequired");
      if (!client) newErrors.client = L.clientRequired;

      const productData = rows.filter((row) => row.name);
      if (productData.length === 0) newErrors.products = t("productsRequired");

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const productCurrency = appStore.isDonoSchool
        ? "31b10867-8169-464e-8d3f-e3bec976fdbb"
        : currency;

      try {
        const payload = {
          legal_entity_id: legalEntity,
          [dealIdField]: dealGuid,
          partners_id: client,
          [isPurchase ? "planned_supply" : "planned_shipment"]: isFutureDate
            ? true
            : isPlanned,
          status_nachislenie: ["confirmed"],
          type: operationType,
          summa: totalSum,
          data_nachislenie: moment.parseZone(shipmentDate).format("YYYY-MM-DD"),
          data_oplaty: moment.parseZone(shipmentDate).format("YYYY-MM-DD"),
          currencies_id: productCurrency,
          description: isPurchase ? "Supply" : "Shipment",
          chart_of_accounts_id: chartOfAccounts,
          product_and_service_data: productData.map((row) => {
            const product = productServicesList.find(
              (p) => p.guid === row.name
            );
            const result = {
              product_and_service_id: product?.guid || row.name || undefined,
              Naimenovanie: product ? product.name : row.naimenovanie || "",
              Artikul: product?.article || row.artikul || "",
              Kol_vo: formatDecimal(StringtoNumber(row.quantity)) || 0,
              TSena_za_ed: formatDecimal(StringtoNumber(row.price)) || 0,
              Summa: formatDecimal(StringtoNumber(row.sum)) || 0,
              Skidka: Number(row.discount?.toString().replace(/\s/g, "")) || 0,
              NDS: Number(row.nds?.toString().replace(/\s/g, "")) || 0,
              unit_of_measurement_id:
                product?.raw?.units_of_measurement_id || undefined,
            };
            if (row.row_guid) {
              result.guid = row.row_guid;
            }
            return result;
          }),
        };

        if (isEditing && initialData?.guid) {
          payload.transaction_guid = initialData.guid;
        }

        const res = await createShipment({
          method: isEditing ? updateMethod : createMethod,
          data: payload,
        });

        const newShipmentId = isEditing
          ? initialData?.guid
          : res?.data?.data?.guid || res?.data?.data?.[0]?.guid;
        if (isNewShipment && newShipmentId) {
          await comments.flushPending(newShipmentId);
        }

        // Clear fields on success
        setShipmentDate(today.toISOString().split("T")[0]);
        setIsPlanned(false);
        setLegalEntity("");
        setClient(kontragentId || "");
        setChartOfAccounts([]);
        setRows([
          {
            id: 1,
            name: "",
            quantity: 0,
            price: 0,
            discount: "",
            nds: "",
            sum: 0,
          },
        ]);
        setSelectedProducts(new Set());
        setErrors({});

        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
        await onSuccess?.();
        onClose();
      } catch (error) {
        console.error(error);
        onClose();
      }
    };

    const handleRemoveRow = () => {
      const newRow = rows.filter((item) => !selectedProducts.has(item.id));
      setRows(newRow);
      setSelectedProducts(new Set());
    };

    const handleSelectProductSerice = (rowId, value) => {
      const product = productServicesList?.find((p) => p.guid === value);
      if (!product) return;

      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          const q = Number(product.kolvo) || 0;
          const p = Number(product.tsena_za_ed) || 0;
          return {
            ...row,
            name: value,
            price: p,
            quantity: q,
            discount: String(product.discount || 0),
            nds: String(product.nds || 0),
            sum: q * p,
          };
        })
      );
    };

    const handleSelect = (value) => {
      setLegalEntity(value);
      if (!value) {
        setCode("");
      }
    };

    const handleChangeCurrency = (value) => {
      const selectedGuid = value || toJS(appStore.currency)?.guid;
      setCurrency(selectedGuid);

      const currencies = toJS(appStore.currencies);
      const icon = currencies.find((item) => item.guid === selectedGuid)?.icon;
      if (legalEntity) {
        setCode(icon);
      }
    };

    if (!open) return null;

    if (isGettingSingleShipment && initialData?.guid) {
      return (
        <>
          {/* Overlay */}
          <div
            className={cn(
              "fixed top-[60px] left-[80px] w-[calc(100%-80px)] h-full right-0 bottom-0 flex bg-black/50 z-1000 transition-opacity duration-300"
            )}
            onClick={onClose}
          />

          {/* Panel */}
          <div className={cn(styles.panel, "flex justify-center items-center")}>
            <Loader />
          </div>
        </>
      );
    }

    return (
      <>
        {/* Overlay */}
        <div
          className={cn(
            "fixed top-[60px] left-[80px] w-[calc(100%-80px)] h-[calc(100%-60px)] right-0 bottom-0 flex bg-black/50  z-1000 transition-opacity duration-300"
          )}
        >
          {/* Panel */}
          <div className={cn(styles.panel, "h-full bg-white flex flex-col")}>
            {/* Header */}
            <div className="p-4 border-b relative">
              <div>
                <h2 className="text-lg font-semibold">
                  {isEditing ? L.titleEdit : L.titleNew}
                </h2>
              </div>
              <button
                className="p-2 absolute right-4 top-2 hover:bg-gray-100 rounded-full"
                onClick={onClose}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-4 flex-1 overflow-auto">
              {/* Date + Planned */}
              <div className="flex gap-2 mb-4">
                <label className=" w-40 text-sm font-medium text-gray-700">
                  {L.shipmentDate} <span className="text-red-500">*</span>
                </label>
                <div
                  className={styles.fieldGroup}
                  style={{ flex: 1, maxWidth: "600px" }}
                >
                  <div className="flex w-full items-center gap-4">
                    <div className="flex items-center gap-2">
                      <FormDatepicker
                        value={shipmentDate}
                        onChange={(value) => {
                          setShipmentDate(value);
                          if (errors.shipmentDate) {
                            setErrors({ ...errors, shipmentDate: null });
                          }
                        }}
                        format="YYYY-MM-DD"
                        inputClass={"w-44!"}
                        placeholder={t("dealDatePlaceholder")}
                      />
                      <div
                        className="flex items-center"
                        style={{
                          opacity: isFutureDate ? 0.5 : 1,
                          pointerEvents: isFutureDate ? "none" : "auto",
                        }}
                      >
                        <OperationCheckbox
                          checked={isFutureDate ? true : isPlanned}
                          onChange={(e) => {
                            if (!isFutureDate) {
                              setIsPlanned(e.target.checked);
                            }
                          }}
                          className={"w-44"}
                          label={L.plannedShipment}
                        />
                      </div>
                    </div>
                  </div>
                  {errors.shipmentDate && (
                    <span className={styles.errorText}>
                      {errors.shipmentDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Legal Entity */}
              <div className="w-full flex items-center gap-2 pb-2">
                <label className="w-40 text-xss!">
                  {t("legalEntity")} <span className={styles.required}>*</span>
                </label>
                <div className="w-80!">
                  <SelectLegelEntitties
                    multi={false}
                    value={legalEntity}
                    onChange={handleSelect}
                    placeholder={t("legalEntityRequired")}
                    childFieldName={"currenies_id"}
                    returnFieldValue={handleChangeCurrency}
                    className="w-80! bg-white"
                  />
                  {errors.legalEntity && (
                    <div className={styles.errorMessage}>
                      {errors.legalEntity}
                    </div>
                  )}
                </div>
                <MyAccountCurrensies
                  guid={legalEntity}
                  value={currency}
                  onChange={handleChangeCurrency}
                  className=" bg-white "
                  wrapperClassName={"w-48"}
                />
              </div>

              {/* Client */}
              <div className="w-full flex items-center gap-2 pb-2">
                <label className="w-40! text-xss!">
                  {L.client} <span className="text-red-500">*</span>
                </label>
                <div className="flex-1">
                  <SingleCounterParty
                    value={client}
                    onChange={(value) => setClient(value)}
                    placeholder={L.clientRequired}
                    name="chart_of_accounts_id"
                    returnChartOfAccount={(value) => setChartOfAccounts(value)}
                    className="w-80! bg-white"
                  />
                </div>
                {errors.client && (
                  <div className={styles.errorMessage}>{errors.client}</div>
                )}
              </div>

              {/* Chart of accounts */}
              {showChartOfAccounts && (
                <div className="w-full flex items-center gap-2 pb-2">
                  <label className="w-40! text-xss!">{L.incomeArticle}</label>
                  <div className="flex-1">
                    <SinglSelectStatiya
                      selectedValue={chartOfAccounts}
                      setSelectedValue={(value) => setChartOfAccounts(value)}
                      placeholder={L.undistributedIncome}
                      className="w-80! bg-white"
                      allowedTypes={allowedTypes}
                    />
                  </div>
                </div>
              )}

              {/* Products Table */}
              <div className={styles.productsSection}>
                <div className={styles.productsSectionHeader}>
                  <div className="flex flex-col gap-1">
                    <span className={styles.productsTitle}>{L.products}</span>
                    {errors.products && (
                      <span className="text-[10px] text-red-500 font-medium">
                        {errors.products}
                      </span>
                    )}
                  </div>
                  {/* <button
                className={styles.fillFromDeal}
                onClick={() => setShowChartOfAccounts(!showChartOfAccounts)}
              >
                Заполнить позициями из сделки
              </button> */}
                </div>

                <div className={styles.tableContainer}>
                  <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-neutral-50">
                      <tr className="bg-neutral-50  text-neutral-600 font-light h-8 text-mini w-full border-b border-gray-200">
                        <th className="w-10">
                          <div className="flex items-center justify-center">
                            <OperationCheckbox
                              type="checkbox"
                              checked={
                                selectedProducts?.size > 0 &&
                                selectedProducts?.size === rows?.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const allrows = rows.map((row) => row.id);
                                  setSelectedProducts(new Set(allrows));
                                } else {
                                  setSelectedProducts(new Set());
                                }
                              }}
                              className={styles.checkbox}
                            />
                          </div>
                        </th>
                        {selectedProducts?.size > 0 && (
                          <th colSpan={6}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-neutral-900">
                                  Выбрано: {selectedProducts?.size}
                                </span>
                                <button
                                  className="outline-none border-none bg-transparent text-sm font-medium text-red-600 cursor-pointer flex items-center gap-2"
                                  onClick={handleRemoveRow}
                                >
                                  <TrashIcon
                                    size={16}
                                    className="text-red-500"
                                  />
                                  {L.removeFromShipment}
                                </button>
                              </div>
                              <button
                                className="outline-none border-none bg-transparent cursor-pointer mr-2"
                                onClick={() => setSelectedProducts(new Set())}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </th>
                        )}
                        {selectedProducts?.size === 0 && (
                          <>
                            <th className="w-[150px]  text-left">
                              {t("productName")}
                            </th>
                            <th className="w-[80px] border-l text-right px-1">
                              {t("quantity")}
                            </th>
                            <th className="w-[120px] border-l text-right px-1">
                              {t("price")} {code}
                            </th>
                            <th className="w-[80px] border-l text-right px-2">
                              {t("discount")}
                            </th>
                            <th className="w-[80px] border-l text-right px-2">
                              {t("nds")}
                            </th>
                            <th className=" border-l text-right px-2">
                              {t("sum")} {code}
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b last:border-none">
                          <td className={styles.checkCol}>
                            <div className="flex items-center justify-center">
                              <OperationCheckbox
                                type="checkbox"
                                checked={selectedProducts.has(row.id)}
                                className={styles.checkbox}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProducts((prev) => {
                                      const next = new Set(prev);
                                      next.add(row.id);
                                      return next;
                                    });
                                  } else {
                                    setSelectedProducts((prev) => {
                                      const next = new Set(prev);
                                      next.delete(row.id);
                                      return next;
                                    });
                                  }
                                }}
                              />
                            </div>
                          </td>
                          <td className="w-[200px]">
                            <div className="pr-2 pt-2 pb-2">
                              <SelectProductService
                                value={row.name}
                                onChange={(value) =>
                                  handleSelectProductSerice(row?.id, value)
                                }
                                placeholder={t("selectPosition")}
                                className="bg-white border-none"
                              />
                            </div>
                          </td>
                          <td className="w-[80px] border-l">
                            <input
                              type="text"
                              min={0}
                              value={formatNumber(row.quantity)}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "quantity",
                                  formatNumber(e.target.value)
                                )
                              }
                              className={
                                "w-full border-none border border-gray-400 h-10 text-end text-xs outline-none pr-2"
                              }
                            />
                          </td>
                          <td className="w-[120px] border-l">
                            <input
                              type="text"
                              min={0}
                              value={formatNumber(row.price)}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "price",
                                  formatNumber(e.target.value)
                                )
                              }
                              className={
                                "w-full border-none border border-gray-400 h-10 text-end text-xs outline-none pr-2"
                              }
                            />
                          </td>
                          <td className="w-[80px] border-l relative">
                            <input
                              type="text"
                              value={row.discount.replace(/\D/g, "")}
                              maxLength={2}
                              onChange={(e) =>
                                updateRow(row.id, "discount", e.target.value)
                              }
                              className={`w-[80px] outline-none text-xs h-10 text-right pr-2 mr-2`}
                            />
                            <span className="absolute top-1/2 text-xs  -translate-y-1/2 right-1">
                              %
                            </span>
                          </td>
                          <td className="w-[80px] border-l relative">
                            <input
                              type="text"
                              maxLength={2}
                              value={row.nds}
                              onChange={(e) =>
                                updateRow(row.id, "nds", e.target.value)
                              }
                              className={`w-[80px] outline-none text-xs h-10 text-right pr-2 mr-2`}
                            />
                            <span className="absolute top-1/2 text-xs  -translate-y-1/2 right-1">
                              %
                            </span>
                          </td>
                          <td className="w-[120px] border-l relative">
                            <input
                              type="text"
                              min={0}
                              value={formatNumber(row.sum)}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "sum",
                                  formatNumber(e.target.value)
                                )
                              }
                              className={
                                "w-full h-full text-xs text-end h-10 border-none outline-none pr-2"
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.tableFooter}>
                  <button className={styles.addRowBtn} onClick={addRow}>
                    {t("addRow")}
                  </button>
                  <p className={styles.totalSum}>
                    {L.shipmentSum}:{" "}
                    <strong>{totalSum.toLocaleString("ru-RU")}</strong>
                    <span className="text-neutral-600 ml-1">{code}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <span className={styles.requiredNote}>
                <span className={styles.required}>*</span> {t("requiredFields")}
              </span>
              <div className={styles.footerActions}>
                <button className={styles.cancelBtn} onClick={onClose}>
                  {t("cancel")}
                </button>
                <button className="primary-btn" onClick={handleCreate}>
                  {isCreating ? <Loader /> : isEditing ? t("save") : t("create")}
                </button>
              </div>
            </div>
          </div>
          <SentMessages
            messages={comments.messages}
            text={comments.text}
            attachedFiles={comments.attachedFiles}
            editingId={comments.editingId}
            editText={comments.editText}
            editFiles={comments.editFiles}
            deleteTargetId={comments.deleteTargetId}
            onTextChange={comments.setText}
            onFileChange={comments.handleFileChange}
            onRemoveAttach={comments.handleRemoveAttach}
            onSend={comments.handleSend}
            onKeyDown={comments.handleKeyDown}
            onEdit={comments.handleEdit}
            onEditChange={comments.setEditText}
            onEditFileChange={comments.handleEditFileChange}
            onEditConfirm={comments.handleEditConfirm}
            onEditCancel={comments.handleEditCancel}
            onDelete={comments.handleDeleteRequest}
            onDeleteConfirm={comments.handleDeleteConfirm}
            onDeleteCancel={comments.handleDeleteCancel}
          />
        </div>
      </>
    );
  }
);

export default CreateShipment;
