import { cn } from "@/lib/utils";
import { keepPreviousData } from "@tanstack/react-query";
import { TrashIcon, X } from "lucide-react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import moment from "moment";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { GlobalCurrency } from "../../../../constants/globalCurrency";
import {
  useUcodeRequestMutation,
  useUcodeRequestQuery,
  useWarehousesList,
} from "../../../../hooks/useDashboard";
import { useOperationComments } from "../../../../hooks/useOperationComments";
import { apiClient } from "../../../../lib/api/ucode/base";
import { productServiceDto } from "../../../../lib/dtos/productServiceDto";
import { queryClient } from "../../../../lib/queryClient";
import { appStore } from "../../../../store/app.store";
import {
  formatAmountInput,
  formatDecimal,
  formatNumber,
  StringtoNumber,
} from "../../../../utils/helpers";
import { showErrorNotification } from "../../../../utils/notifications";
import SentMessages from "../../../operations/OperationModal/SentMessages";
import MyAccountCurrensies from "../../../ReadyComponents/MyAccountCurrensies";
import SelectLegelEntitties from "../../../ReadyComponents/SelectLegelEntitties";
import SelectProductService from "../../../ReadyComponents/SelectProductService";
import SelectProjects from "../../../ReadyComponents/SelectProjects";
import SingleCounterParty from "../../../ReadyComponents/SingleCounterParty";
import SinglSelectStatiya from "../../../ReadyComponents/SingleSelectStatiya";
import OperationCheckbox from "../../../shared/Checkbox/operationCheckbox";
import FormDatepicker from "../../../shared/DatePicker/form-datepicker";
import Loader from "../../../shared/Loader";
import SingleSelect from "../../../shared/Selects/SingleSelect";
import styles from "./style.module.scss";

// get_stock_count → доступный остаток. Значение лежит в data.data.quantity,
// но уровней вложенности `data` в конверте может быть разное число, поэтому
// ищем поле `quantity` защитно на любой глубине ответа.
const readStockCount = (res) => {
  const seen = new Set();
  const find = (obj) => {
    if (!obj || typeof obj !== "object" || seen.has(obj)) return undefined;
    seen.add(obj);
    if (obj.quantity != null && !Number.isNaN(Number(obj.quantity))) {
      return Number(obj.quantity);
    }
    for (const key of Object.keys(obj)) {
      const found = find(obj[key]);
      if (found != null) return found;
    }
    return undefined;
  };
  return find(res) ?? 0;
};

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
    isReturn = false,
  }) => {
    const t = useTranslations("Deals.createShipment");
    const tp = useTranslations("Purchases.createSupply");
    // Same modal is reused for a sale's "Отгрузка" and a purchase's "Поставка" —
    // only these labels diverge between the two contexts.
    const baseL = isPurchase
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
    // A return reuses the same form/methods as a normal shipment or supply —
    // only the header title changes to make the negative-amount mode obvious.
    const L = isReturn
      ? {
          ...baseL,
          titleNew: t("titleNewReturn"),
          titleEdit: t("titleEditReturn"),
        }
      : baseL;
    // Returns force every price/sum entry negative so the transaction reads
    // as money/stock flowing back out; the user is never allowed to flip it positive.
    const signPrice = (value) => {
      const num = Number(value) || 0;
      return isReturn ? -Math.abs(num) : num;
    };
    const today = useMemo(() => new Date(), []);

    const [shipmentDate, setShipmentDate] = useState(
      today.toISOString().split("T")[0]
    );
    const isFutureDate =
      new Date(shipmentDate).setHours(0, 0, 0, 0) > today.setHours(0, 0, 0, 0);
    // Остаток считается на дату отгрузки/поставки — её и передаём в get_stock_count
    const stockDate = moment.parseZone(shipmentDate).format("YYYY-MM-DD");

    const [isPlanned, setIsPlanned] = useState(true);
    const [legalEntity, setLegalEntity] = useState("");
    const [client, setClient] = useState(kontragentId || "");
    const [project, setProject] = useState("");
    const [chartOfAccounts, setChartOfAccounts] = useState([]);
    const [currency, setCurrency] = useState("");
    const [showChartOfAccounts, setShowChartOfAccounts] = useState(true);
    const [warehouse, setWarehouse] = useState("");
    // A Поставка posts either against a warehouse (goods, Tip=product) or directly
    // against an expense article (services, Tip=service). Picking one drives the other.
    const [isServiceSupply, setIsServiceSupply] = useState(false);
    const isWarehouseModuleOn = appStore.warehouseActive;
    // The "planned" flag toggles stock commitment, so only a user with warehouse
    // read access may change it; without access the checkbox stays locked.
    const hasWarehouseAccess = Boolean(appStore.permission.warehouse?.read);
    const isPlannedLocked = isFutureDate || !hasWarehouseAccess;
    // Outflow ops (sale shipment / supply return) draw goods FROM the warehouse,
    // so their quantities are validated against available stock.
    const isOutflow = (isPurchase && isReturn) || (!isPurchase && !isReturn);
    const effectivePlanned = isFutureDate ? true : isPlanned;
    const { data: warehousesData } = useWarehousesList();
    const warehouseOptions = useMemo(
      () =>
        (warehousesData || []).map((w) => ({ value: w.guid, label: w.name })),
      [warehousesData]
    );
    // Product picker filter: a warehouse supply lists goods (Tip=product), a
    // service supply lists services. Only the purchase form with the warehouse
    // module on makes this split; otherwise both are shown.
    const productType =
      isPurchase && isWarehouseModuleOn
        ? isServiceSupply
          ? "service"
          : "product"
        : undefined;
    // Поставка на склад: товар приходуется складом, проект к ней не относится —
    // поле «Проект» скрываем и не отправляем. В сервисной поставке (без склада)
    // проект остаётся.
    const isWarehouseSupply =
      isPurchase && isWarehouseModuleOn && !isServiceSupply && !!warehouse;
    const showProjectField = appStore.projectActive && !isWarehouseSupply;
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
        setProject(SingleShipment.projects_id || "");
        setChartOfAccounts(SingleShipment.chart_of_accounts_id || "");
        setWarehouse(SingleShipment.warehouse_id || "");
        // Restore the supply mode: a saved article with no warehouse = service supply.
        setIsServiceSupply(
          isPurchase &&
            !!SingleShipment.chart_of_accounts_id &&
            !SingleShipment.warehouse_id
        );
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
              productServiceId: row.product_and_service_id || "",
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
        // Default the "planned" flag to on only when the user can toggle it
        // (has warehouse access); without access it defaults to off.
        setIsPlanned(hasWarehouseAccess);
        setLegalEntity("");
        setClient(kontragentId || "");
        setProject("");
        setChartOfAccounts([]);
        setWarehouse("");
        setIsServiceSupply(false);
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
    }, [
      open,
      SingleShipment,
      kontragentId,
      today,
      initialData?.guid || null,
      hasWarehouseAccess,
    ]);

    // Default to the first warehouse on create (sale/Отгрузка only) — the list may
    // still be loading when the modal opens, so this re-fires once it arrives.
    // A Поставка requires the warehouse to be picked manually, so it is NOT
    // auto-selected there (also avoids re-selecting it right after the user clears it).
    useEffect(() => {
      if (
        isWarehouseModuleOn &&
        !isPurchase &&
        open &&
        !initialData?.guid &&
        !warehouse &&
        !isServiceSupply &&
        warehouseOptions.length > 0
      ) {
        setWarehouse(warehouseOptions[0].value);
      }
    }, [
      isWarehouseModuleOn,
      isPurchase,
      open,
      initialData?.guid,
      warehouseOptions,
      warehouse,
      isServiceSupply,
    ]);

    // Поставка: in warehouse mode the article follows the selected warehouse
    // (autofilled) and clears when the warehouse is cleared; service mode keeps
    // the user-picked article. Runs on every warehouse / warehouse-list change so
    // the article is filled even for the default warehouse picked above.
    useEffect(() => {
      if (!isPurchase || isServiceSupply) return;
      const wh = warehouse
        ? (warehousesData || []).find((w) => w.guid === warehouse)
        : null;
      setChartOfAccounts(wh?.chart_of_accounts_id || "");
    }, [isPurchase, isServiceSupply, warehouse, warehousesData]);

    const [selectedProducts, setSelectedProducts] = useState(new Set());

    const [errors, setErrors] = useState({});
    const [isCheckingStock, setIsCheckingStock] = useState(false);
    // product_and_service_id → available quantity in the selected warehouse,
    // fetched via get_stock_count the moment a product is picked (real-time).
    const [stockByProduct, setStockByProduct] = useState({});

    // Fetch legal entities data

    const { mutateAsync: createShipment, isPending: isCreating } =
      useUcodeRequestMutation();

    // Faqat shu сделкага tegishli товарларни оламиз (акс ҳолда барча товарлар келади)
    const { data: productServices } = useUcodeRequestQuery({
      method: "list_products_and_services",
      data: {
        [isPurchase ? "purchase_transactions_id" : "sales_transactions_id"]: dealGuid,
        page: 1,
        limit: 1000,
      },
      skip: !dealGuid,
      querySetting: {
        select: (data) => data?.data?.data,
      },
    });

    const productServicesList = useMemo(() => {
      return productServiceDto(productServices);
    }, [productServices]);

    // Проект сделки — для автозаполнения поля «Проект» при создании отгрузки/поставки
    const { data: shipmentDealData } = useUcodeRequestQuery({
      queryKey: "shipment_deal_project",
      method: isPurchase
        ? "get_purchase_transaction_by_guid"
        : "get_sales_transaction_by_guid",
      data: { guid: dealGuid },
      skip: !dealGuid || !appStore.projectActive || isEditing,
      querySetting: { select: (d) => d?.data?.data },
    });

    useEffect(() => {
      // у складской поставки поле скрыто — автозаполнять нечего
      if (isWarehouseSupply) return;
      if (open && !initialData?.guid && shipmentDealData?.projects_id) {
        setProject(shipmentDealData.projects_id);
      }
    }, [open, initialData?.guid, shipmentDealData?.projects_id, isWarehouseSupply]);

    // Значение пикера — guid связки «сделка-товар», но при редактировании и
    // копировании в строку кладётся product_and_service_id. Ищем по обоим
    // ключам, иначе товар из скопированной отгрузки считается неизвестным.
    const findProduct = (rowName) =>
      productServicesList.find(
        (p) => p.guid === rowName || p.product_and_service_id === rowName
      );

    /**
     * Товары строк, по которым нужно проверять остаток:
     *   ключ строки (row.name) → реальный product_and_service_id.
     * Услуги пропускаем. Товар, которого нет в списке сделки (так бывает у
     * скопированной отгрузки, пока список не подгрузился, и у позиций,
     * заведённых вне сделки), считаем складским — лучше проверить остаток,
     * чем молча пропустить проверку.
     */
    const stockTargets = useMemo(() => {
      const map = new Map();
      rows.forEach((row) => {
        if (!row.name) return;
        const product = productServicesList.find(
          (p) => p.guid === row.name || p.product_and_service_id === row.name
        );
        if (product?.tip && product.tip !== "product") return;
        map.set(
          row.name,
          row.productServiceId || product?.product_and_service_id || row.name
        );
      });
      return map;
    }, [rows, productServicesList]);

    // Остаток считается на конкретный склад и дату: при их смене прошлые
    // значения больше не годятся. Сбрасываем во время рендера, а не в эффекте,
    // чтобы не гонять лишний цикл и не подсовывать устаревшие цифры.
    const stockScope = `${warehouse}|${stockDate}`;
    const [prevStockScope, setPrevStockScope] = useState(stockScope);
    if (prevStockScope !== stockScope) {
      setPrevStockScope(stockScope);
      setStockByProduct({});
    }

    // Догружаем остатки для всех выбранных товаров — в том числе для строк,
    // которые пришли из копируемой/редактируемой отгрузки уже заполненными.
    // Без этого предупреждение о нехватке появлялось только после того, как
    // пользователь заново выбирал товар в списке.
    const stockInFlight = useRef(new Set());
    useEffect(() => {
      if (!isWarehouseModuleOn || !isOutflow || !warehouse) return;
      stockTargets.forEach((productId, rowKey) => {
        if (stockByProduct[rowKey] != null) return;
        const key = `${stockScope}|${rowKey}`;
        if (stockInFlight.current.has(key)) return;
        stockInFlight.current.add(key);
        apiClient
          .invokeFunction({
            method: "get_stock_count",
            data: {
              product_and_service_id: productId,
              warehouse_id: warehouse,
              date: stockDate,
            },
          })
          .then((res) =>
            setStockByProduct((prev) => ({
              ...prev,
              [rowKey]: readStockCount(res),
            }))
          )
          .catch((e) => console.error("get_stock_count failed", e))
          .finally(() => stockInFlight.current.delete(key));
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [warehouse, stockDate, stockTargets, stockByProduct]);

    // Real-time shortages: which products have total requested qty > available.
    // Only meaningful once "planned" is off (goods actually move) for an outflow.
    const stockShortages = useMemo(() => {
      if (!isWarehouseModuleOn || !isOutflow || !warehouse || effectivePlanned)
        return [];
      const requested = new Map();
      rows.forEach((r) => {
        if (!r.name || !stockTargets.has(r.name)) return;
        const q = formatDecimal(StringtoNumber(r.quantity)) || 0;
        requested.set(r.name, (requested.get(r.name) || 0) + q);
      });
      const out = [];
      requested.forEach((req, pid) => {
        const avail = stockByProduct[pid];
        if (avail == null) return; // not fetched yet
        if (req > avail) {
          // название ищем по обоим ключам, иначе у скопированной строки
          // предупреждение выводилось без имени товара
          const pname =
            findProduct(pid)?.name ||
            rows.find((r) => r.name === pid)?.naimenovanie ||
            "";
          out.push({ pid, name: pname, requested: req, available: avail });
        }
      });
      return out;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      rows,
      stockByProduct,
      stockTargets,
      effectivePlanned,
      warehouse,
      productServicesList,
    ]);

    const shortedProductIds = useMemo(
      () => new Set(stockShortages.map((s) => s.pid)),
      [stockShortages]
    );

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
            let p = Number(updated.price?.toString().replace(/\s/g, "")) || 0;
            if (isReturn) {
              p = signPrice(p);
              updated.price = p;
            }
            const d =
              Number(updated.discount?.toString().replace(/\s/g, "")) || 0;
            const n = Number(updated.nds?.toString().replace(/\s/g, "")) || 0;
            const subtotal = q * p;
            const afterDiscount = subtotal * (1 - d / 100);
            updated.sum = signPrice(afterDiscount * (1 + n / 100));
          }

          if (field === "sum") {
            // Back-calculate price from sum: price = sum / qty / (1 - d/100) / (1 + n/100)
            const rawSum = signPrice(
              Number(value?.toString().replace(/\s/g, "")) || 0
            );
            updated.sum = rawSum;
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
              updated.price = divisor ? signPrice(rawSum / divisor) : 0;
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
      // A service supply posts against an article instead of a warehouse, so the
      // warehouse is only required in warehouse mode.

      const productData = rows.filter((row) => row.name);
      if (productData.length === 0) newErrors.products = t("productsRequired");

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Warehouse stock guard — an executed (non-planned) OUTFLOW must not exceed
      // available stock. Applies with the warehouse module on when saving a
      // supply-return or a sale-shipment with "planned" switched off. Re-fetches
      // fresh counts here (authoritative), on top of the real-time on-select
      // check. Quantities of the same product across rows are summed first.
      if (isWarehouseModuleOn && warehouse && !effectivePlanned && isOutflow) {
        const requestedByProduct = new Map();
        productData.forEach((row) => {
          const pid = stockTargets.get(row.name);
          if (!pid) return;
          const qty = formatDecimal(StringtoNumber(row.quantity)) || 0;
          requestedByProduct.set(pid, (requestedByProduct.get(pid) || 0) + qty);
        });

        try {
          setIsCheckingStock(true);
          const shortages = [];
          await Promise.all(
            [...requestedByProduct.entries()].map(async ([pid, requested]) => {
              const stockRes = await apiClient.invokeFunction({
                method: "get_stock_count",
                data: {
                  product_and_service_id: pid,
                  warehouse_id: warehouse,
                  date: stockDate,
                },
              });
              const available = readStockCount(stockRes);
              if (requested > available) {
                const pname =
                  productServicesList.find(
                    (p) => p.product_and_service_id === pid || p.guid === pid
                  )?.name || "";
                shortages.push({ name: pname, requested, available });
              }
            })
          );

          if (shortages.length > 0) {
            const message = shortages
              .map((s) =>
                t("stockExceeded", {
                  name: s.name,
                  available: s.available,
                  requested: s.requested,
                })
              )
              .join("\n");
            showErrorNotification(message);
            setErrors((prev) => ({ ...prev, products: t("stockError") }));
            return;
          }
        } catch (stockError) {
          console.error("get_stock_count failed", stockError);
          showErrorNotification(t("stockCheckFailed"));
          return;
        } finally {
          setIsCheckingStock(false);
        }
      }

      const productCurrency = appStore.isDonoSchool
        ? "31b10867-8169-464e-8d3f-e3bec976fdbb"
        : currency;

      try {
        const payload = {
          legal_entity_id: legalEntity,
          [dealIdField]: dealGuid,
          partners_id: client,
          // поле скрыто у складской поставки — значение не отправляем
          ...(showProjectField ? { projects_id: project || null } : {}),
          [isPurchase ? "planned_supply" : "planned_shipment"]: isFutureDate
            ? true
            : isPlanned,
          status_nachislenie: ["confirmed"],
          type: operationType,
          summa: signPrice(totalSum),
          data_nachislenie: moment.parseZone(shipmentDate).format("YYYY-MM-DD"),
          data_oplaty: moment.parseZone(shipmentDate).format("YYYY-MM-DD"),
          currencies_id: productCurrency,
          description: isPurchase ? "Supply" : "Shipment",
          chart_of_accounts_id: chartOfAccounts,
          warehouse_id: warehouse || null,
          product_and_service_data: productData.map((row) => {
            const product = productServicesList.find(
              (p) => p.guid === row.name
            );
            const result = {
              product_and_service_id:
                row.productServiceId ||
                product?.product_and_service_id ||
                row.name ||
                undefined,
              Naimenovanie: product ? product.name : row.naimenovanie || "",
              Artikul: product?.article || row.artikul || "",
              Kol_vo: formatDecimal(StringtoNumber(row.quantity)) || 0,
              TSena_za_ed: signPrice(
                formatDecimal(StringtoNumber(row.price)) || 0
              ),
              Summa: signPrice(formatDecimal(StringtoNumber(row.sum)) || 0),
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
        setWarehouse("");
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

    const handleSelectProductSerice = (rowId, value, raw) => {
      // Товар может отсутствовать в productServicesList (напр. когда «Мой склад»
      // выключен и список подтягивается иначе) — выбор всё равно должен сработать.
      const product =
        productServicesList?.find((p) => p.guid === value) ||
        productServicesList?.find((p) => p.product_and_service_id === value);

      // Реальный product_and_service_id для payload: берём напрямую из выбранного
      // элемента пикера (authoritative), иначе из списка сделки, иначе — само
      // значение. Иначе на create ушёл бы guid связки вместо product_and_service_id.
      const productServiceId =
        raw?.product_and_service_id || product?.product_and_service_id || value;

      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          if (!product) {
            // хотя бы регистрируем выбор; цену/кол-во пользователь введёт вручную
            return { ...row, name: value, productServiceId };
          }
          // Тот же товар выбран повторно — только фиксируем выбор. Иначе
          // подстановка значений из сделки затирала бы количество и цену,
          // перенесённые из копируемой/редактируемой отгрузки.
          const isSameProduct =
            row.name === value ||
            (!!row.productServiceId &&
              row.productServiceId === productServiceId);
          if (isSameProduct) {
            return { ...row, name: value, productServiceId };
          }
          const q = Number(product.kolvo) || 0;
          const p = signPrice(Number(product.tsena_za_ed) || 0);
          return {
            ...row,
            name: value,
            productServiceId,
            price: p,
            quantity: q,
            discount: String(product.discount || 0),
            nds: String(product.nds || 0),
            sum: signPrice(q * p),
          };
        })
      );
      // остаток по выбранному товару догрузит эффект — он следит за строками
    };

    // Блокируем по СОХРАНЁННОМУ флагу из ответа, а не по живой галке: документ,
    // пришедший исполненным (planned = false), уже двинул остатки и правке не
    // подлежит. Снятие галки в форме — наоборот, штатный способ исполнить
    // плановый документ, поэтому кнопку оно гасить не должно.
    // При выключенном модуле «Мой склад» остатков нет — ограничение не действует.
    const savedPlanned = isPurchase
      ? SingleShipment?.planned_supply
      : SingleShipment?.planned_shipment;
    const isSaveBlockedByClosedWarehouse =
      isEditing && isWarehouseModuleOn && !!SingleShipment && !savedPlanned;

    // Поставка: warehouse ↔ article are linked. Picking a warehouse autofills its
    // article and lists goods; clearing it resets the article. (Sale keeps plain behaviour.)
    const handleWarehouseChange = (value) => {
      setWarehouse(value);
      if (errors.warehouse) setErrors({ ...errors, warehouse: null });
      // Leaving warehouse mode; the article is autofilled/reset by an effect.
      if (isPurchase) setIsServiceSupply(false);
      // У поставки на склад проекта нет: поле скрывается, поэтому сбрасываем
      // и ранее выбранное (в т.ч. автозаполненное из сделки) значение
      if (isPurchase && isWarehouseModuleOn && value) setProject("");
    };

    // Поставка: picking an article directly = a service supply — clear/disable the
    // warehouse and list services in the product picker.
    const handleArticleChange = (value) => {
      setChartOfAccounts(value);
      if (!isPurchase) return;
      if (value) {
        setIsServiceSupply(true);
        setWarehouse("");
      } else {
        setIsServiceSupply(false);
      }
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
                          opacity: isPlannedLocked ? 0.5 : 1,
                          pointerEvents: isPlannedLocked ? "none" : "auto",
                        }}
                      >
                        <OperationCheckbox
                          checked={isFutureDate ? true : isPlanned}
                          onChange={(e) => {
                            if (!isPlannedLocked) {
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

              {/* Проект — только если включён модуль проектов (автозаполнение из
                  сделки) и это не поставка на склад */}
              {showProjectField && (
                <div className="w-full flex items-center gap-2 pb-2">
                  <label className="w-40! text-xss!">{t("project")}</label>
                  <div className="flex-1">
                    <SelectProjects
                      value={project}
                      onChange={(value) => setProject(value)}
                      placeholder={t("projectPlaceholder")}
                      className="w-80! bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Warehouse — above the article; shown once the module is on */}
              {isWarehouseModuleOn && (
                <div className="w-full flex items-center gap-2 pb-2">
                  <label className="w-40! text-xss!">{t("warehouse")}</label>
                  <div className="flex-1">
                    <SingleSelect
                      data={warehouseOptions}
                      value={warehouse}
                      onChange={handleWarehouseChange}
                      placeholder={t("warehousePlaceholder")}
                      className="w-80! bg-white"
                      hasError={!!errors.warehouse}
                    />
                    {errors.warehouse && (
                      <div className={styles.errorMessage}>
                        {errors.warehouse}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chart of accounts — shown for both Отгрузка and Поставка */}
              {showChartOfAccounts && (
                <div className="w-full flex items-center gap-2 pb-2">
                  <label className="w-40! text-xss!">{L.incomeArticle}</label>
                  <div className="flex-1">
                    <SinglSelectStatiya
                      selectedValue={chartOfAccounts}
                      setSelectedValue={handleArticleChange}
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
                    {stockShortages.map((s) => (
                      <span
                        key={s.pid}
                        className="text-[10px] text-red-500 font-medium"
                      >
                        {t("stockExceeded", {
                          name: s.name,
                          available: s.available,
                          requested: s.requested,
                        })}
                      </span>
                    ))}
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
                                // Приводим значение к guid опции: при копировании
                                // и редактировании в строке лежит
                                // product_and_service_id, и пикер, не найдя его
                                // среди опций, дорисовывал товар вторым пунктом
                                value={findProduct(row.name)?.guid || row.name}
                                selectedLabel={row.naimenovanie}
                                onChange={(value, raw) =>
                                  handleSelectProductSerice(row?.id, value, raw)
                                }
                                type={productType}
                                sellingDealId={dealGuid}
                                dealIdField={isPurchase ? "purchase_transactions_id" : "sales_transactions_id"}
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
                              className={cn(
                                "w-full border-none border border-gray-400 h-10 text-end text-xs outline-none pr-2",
                                row.name &&
                                  shortedProductIds.has(row.name) &&
                                  "bg-red-50 text-red-600"
                              )}
                            />
                          </td>
                          <td className="w-[120px] border-l">
                            <input
                              type="text"
                              min={0}
                              value={formatAmountInput(row.price)}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "price",
                                  formatAmountInput(e.target.value)
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
                              value={formatAmountInput(row.sum)}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "sum",
                                  formatAmountInput(e.target.value)
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

                <button
                  className="primary-btn"
                  onClick={handleCreate}
                  disabled={
                    isCreating ||
                    isCheckingStock ||
                    isSaveBlockedByClosedWarehouse
                  }
                >
                  {isCreating || isCheckingStock ? (
                    <Loader />
                  ) : isEditing ? (
                    t("save")
                  ) : (
                    t("create")
                  )}
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
