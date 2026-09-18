import {
  useUcodeDefaultApiQuery,
  useUcodeRequestQuery,
} from "@/hooks/useDashboard";
import { ucodeRequest } from "@/lib/api/ucode/base";
import { useEffect, useMemo, useState } from "react";

const GROUPED_LIMIT = 1000;

async function fetchAllProductServices(data) {
  const first = await ucodeRequest({
    method: "list_products_and_services",
    data,
  });
  const pagination = first?.data?.pagination;
  const total = Number(pagination?.total) || 0;
  const totalPages =
    Number(pagination?.totalPages) || Math.ceil(total / GROUPED_LIMIT);
  if (totalPages <= 1) return first;

  const items = [...(first?.data?.data || [])];
  for (let page = 2; page <= totalPages; page++) {
    const res = await ucodeRequest({
      method: "list_products_and_services",
      data: { ...data, page },
    });
    const pageItems = res?.data?.data || [];
    items.push(...pageItems);
    if (!pageItems.length) break;
  }

  return { ...first, data: { ...first.data, data: items } };
}

export function useProductServiceData(t, tc) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filters, setFilters] = useState({ type: "all", group: "none" });
  const [requestFilters, setRequestFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setRequestFilters(filters), 1000);
    return () => clearTimeout(timer);
  }, [filters]);

  const isGroupedRequest = requestFilters?.group !== "none";
  const requestData = {
    page: 1,
    limit: isGroupedRequest ? GROUPED_LIMIT : 100,
    from_date: "",
    to_date: "",
    search: debouncedSearchQuery,
    type: requestFilters?.type,
  };

  const { data: productServices, isLoading } = useUcodeRequestQuery({
    method: "list_products_and_services",
    data: requestData,
    querySetting: {
      select: (data) => data?.data,
      ...(isGroupedRequest && {
        queryFn: () => fetchAllProductServices(requestData),
      }),
    },
  });

  const { data: productServicesGrouped } = useUcodeDefaultApiQuery({
    queryKey: "product-services-grouped",
    urlMethod: "GET",
    urlParams:
      "/items/group_product_and_service?from-ofs=true&data=%7B%22offset%22%3A0%2C%22limit%22%3A1000%7D",
    querySetting: { select: (data) => data?.data?.data?.response },
  });

  const productServicesList = useMemo(() => {
    const rawList =
      productServices?.data
        ?.filter((item) =>
          filters?.type === "all" ? true : item?.Status?.includes(filters?.type)
        )
        .map((item) => {
          const price = Number(item?.TSena_za_ed) || 0;
          const vatStr = item?.NDS || "";
          const vatNum = parseFloat(vatStr) || 0;
          const priceWithVat = vatNum > 0 ? price * (1 + vatNum / 100) : price;

          const groupResponse = productServicesGrouped;
          const groupData = groupResponse?.find(
            (g) => g.guid === item?.product_and_service_group_id
          );
          const groupName = groupData
            ? groupData.name || groupData.nazvanie_gruppy || t("noGroup")
            : t("noGroup");
          const groupId = item?.product_and_service_group_id || "no-group";

          return {
            guid: item?.guid,
            name: item?.Naimenovanie,
            artikul: item?.Artikul,
            group: groupName,
            price,
            unit: item?.unit_name || "—",
            vat: vatStr ? `${vatStr}%` : "—",
            priceWithVat: Math.round(priceWithVat),
            comment: item?.Kommentariy || "",
            type: item?.Status
              ? item?.Status?.[0] === "product"
                ? t("types.products")
                : t("types.services")
              : "",
            raw: item,
            // used === true → товар уже задействован в операциях/сделках:
            // валюту менять нельзя и удалять его нельзя
            used: !!item?.used,
            currency: item?.currenies_symbol,
            groupName: groupName,
            groupId: groupId,
          };
        }) || [];

    if (filters?.group === "none") return rawList;

    const groupsMap = new Map();
    if (productServicesGrouped) {
      productServicesGrouped.forEach((group) => {
        groupsMap.set(group.guid, {
          isGroup: true,
          guid: group.guid,
          name: group.name || group.nazvanie_gruppy || tc("noName"),
          items: [],
          raw: group,
          commentary: group.commentary,
        });
      });
    }

    rawList.forEach((item) => {
      if (!groupsMap.has(item.groupId)) {
        groupsMap.set(item.groupId, {
          isGroup: true,
          guid: item.groupId,
          name: item.groupName,
          items: [],
        });
      }
      groupsMap.get(item.groupId).items.push(item);
    });

    const groupedArray = Array.from(groupsMap.values());
    groupedArray.sort((a, b) => {
      if (a.guid === "no-group") return -1;
      if (b.guid === "no-group") return 1;
      return a.name.localeCompare(b.name);
    });
    return groupedArray;
  }, [productServices, productServicesGrouped, filters, t, tc]);

  const totalItemsCount = useMemo(
    () => productServices?.total,
    [productServices]
  );

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    productServicesList,
    totalItemsCount,
    isLoading,
  };
}
