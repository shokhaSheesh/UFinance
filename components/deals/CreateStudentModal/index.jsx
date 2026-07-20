"use client";
import SelectLegelEntitties from "@/components/ReadyComponents/SelectLegelEntitties";
import SelectProductService from "@/components/ReadyComponents/SelectProductService";
import SingleCounterParty from "@/components/ReadyComponents/SingleCounterParty";
import SinglSelectStatiya from "@/components/ReadyComponents/SingleSelectStatiya";
import CustomDialog from "@/components/shared/CustomDialog";
import FormDatepicker from "@/components/shared/DatePicker/form-datepicker";
import Input from "@/components/shared/Input";
import Loader from "@/components/shared/Loader";
import SingleSelect from "@/components/shared/Selects/SingleSelect";
import {
  useUcodeDefaultApiMutation,
  useUcodeDefaultApiQuery,
  useUcodeRequestQuery,
} from "@/hooks/useDashboard";
import { apiClient } from "@/lib/api/ucode/base";
import { queryClient } from "@/lib/queryClient";
import {
  showErrorNotification,
  showSuccessNotification,
} from "@/lib/utils/notifications";
import { authStore } from "@/store/auth.store";
import {
  formatNumber,
  formatPhoneNumber,
  getPeriodLength,
} from "@/utils/helpers";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Edit2, Eye, Loader2, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import moment from "moment";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

const academicYears = Array.from({ length: 20 }, (_, i) => {
  const start = 2020 + i;
  return { value: `${start}-${start + 1}`, label: `${start}-${start + 1}` };
});

const today = moment(new Date()).format("YYYY-MM-DD");

// Состояние договора приходит из API массивом status: ["active" | "passive"].
// Отчёт по ученикам хранит его же как булев contract_status — поддерживаем оба.
// Неизвестное значение считаем активным, чтобы не заблокировать форму по ошибке.
const resolveContractStatus = (data) => {
  if (!data) return null;
  const raw = Array.isArray(data.status) ? data.status[0] : data.status;
  if (raw === "active" || raw === "passive") return raw;
  if (typeof data.contract_status === "boolean") {
    return data.contract_status ? "active" : "passive";
  }
  return "active";
};

// Сохранённый номер может прийти без маски или с потерянными пробелами —
// приводим его к виду +998 XX XXX XX XX для показа в форме
const formatSavedPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length <= 3) return "";
  const withCode = digits.startsWith("998") ? digits : `998${digits}`;
  return formatPhoneNumber(`+${withCode}`);
};

// В API номер уходит без пробелов: +998XXXXXXXXX
const cleanPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length <= 3) return "";
  return `+${digits}`;
};

const CreateStudentModal = observer(
  ({ isOpen, onClose, onSubmit, dealGuid }) => {
    const t = useTranslations("Deals.createStudentModal");

    const clientType = [
      { value: "new", label: t("new") },
      { value: "old", label: t("old") },
    ];

    const sostayaniya = [
      { value: "active", label: t("statusActive") },
      { value: "passive", label: t("statusPassive") },
    ];
    const [step, setStep] = useState("form"); // 'form' | 'preview'
    const [isSaving, setIsSaving] = useState(false);
    const [contractTemplate, setContractTemplate] = useState("");
    const [activeContractIndex, setActiveContractIndex] = useState(0);
    const [openClassModal, setOpenClassModal] = useState(false);
    const [classModalMode, setClassModalMode] = useState("create"); // 'create' | 'edit' | 'delete'
    const [editingClass, setEditingClass] = useState(null);
    const [classNameInput, setClassNameInput] = useState("");
    const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
    const [openGuardianModal, setOpenGuardianModal] = useState(false);
    const [guardianModalMode, setGuardianModalMode] = useState("create");
    const [editingGuardian, setEditingGuardian] = useState(null);
    const [guardianTypeInput, setGuardianTypeInput] = useState("");
    const [deleteGuardianItem, setDeleteGuardianItem] = useState(null);
    // Данные валидной формы, ожидающие подтверждения перед сохранением
    const [pendingSubmitData, setPendingSubmitData] = useState(null);
    const branch = authStore.selectBranch;
    const isEditMode = !!dealGuid;

    const {
      data: initialData,
      isLoading,
      refetch: refetchContract,
    } = useUcodeRequestQuery({
      method: "get_contract_with_counterparty",
      data: {
        guid: dealGuid,
      },
      querySetting: {
        enabled: !!dealGuid,
        staleTime: 0,
        cacheTime: 0,
        select: (res) => res?.data?.data,
      },
    });

    // Модалка не размонтируется при закрытии, поэтому при каждом открытии
    // подтягиваем свежие данные договора вручную
    useEffect(() => {
      if (isOpen && dealGuid) refetchContract();
    }, [isOpen, dealGuid, refetchContract]);

    const contractStatus = useMemo(
      () => resolveContractStatus(initialData),
      [initialData]
    );

    // Пассивный договор редактировать нельзя — форма только для чтения
    const isPassiveContract = isEditMode && contractStatus === "passive";
    // Поля, согласованные как редактируемые: открыты при создании и у активного договора
    const isEditableLocked = isPassiveContract;
    // Остальные поля договора: задаются только при создании
    const isFixedLocked = isEditMode;

    const defaultValues = useMemo(() => {
      if (initialData && dealGuid) {
        return {
          contractNumber: initialData?.number_contract || "",
          contractDate: initialData?.date_contract
            ? moment(initialData.date_contract).format("YYYY-MM-DD")
            : today,
          guardianName: initialData?.full_name_guardian || "",
          branchName: branch?.name || "",
          guardianType: initialData?.type_guardian?.[0] || null,
          academicYear: initialData?.school_year,
          phone1: formatSavedPhone(initialData?.first_phone_number),
          studentName: initialData?.counterparties_id_data?.nazvanie || "",
          phone2: formatSavedPhone(initialData?.second_phone_number),
          passport: initialData?.number_passport || "",
          pinf: initialData?.jshshr_guardian || null,
          issuedBy: initialData?.place_of_issue || "",
          tariffName: initialData?.product_and_service_id?.name || "",
          chartOfAccounts:
            initialData?.chart_of_accounts_id_data?.nazvanie || "",
          legalEntity: initialData?.legal_entity_id_data?.nazvanie || "",
          birthDate: initialData?.birthday_pupil
            ? moment(initialData.birthday_pupil).format("YYYY-MM-DD")
            : today,
          validFrom: initialData?.the_contract_period_is_from
            ? moment(initialData.the_contract_period_is_from).format(
                "YYYY-MM-DD"
              )
            : today,
          gender: initialData?.select_gender?.[0] || "",
          validTo: initialData?.the_contract_period_is_to
            ? moment(initialData.the_contract_period_is_to).format("YYYY-MM-DD")
            : today,
          className:
            initialData?.classes_id_data?.name ||
            initialData?.className ||
            null,
          clientType: initialData?.pupil_type?.[0] || "",
          language: initialData?.language_classes_id_data?.name || "",
          status: resolveContractStatus(initialData) || "active",
          address: initialData?.address || "",
          passiveDate: initialData?.passive_date
            ? moment(initialData.passive_date).format("YYYY-MM-DD")
            : today,
          counterparties_id: initialData?.counterparties_id || null,
          product_and_service_id: initialData?.product_and_service_id || null,
          chart_of_accounts_id: initialData?.chart_of_accounts_id || null,
          classes_id: initialData?.classes_id || null,
          language_classes_id: initialData?.language_classes_id || null,
          legal_entity_id: initialData?.legal_entity_id || null,
          monthlyPayment: initialData?.product_and_service_id_data?.summa,
        };
      }
      return {
        contractNumber: "",
        contractDate: today,
        guardianName: "",
        branchName: branch?.name || "",
        guardianType: "",
        academicYear: "",
        phone1: "",
        studentName: "",
        phone2: "",
        passport: "",
        pinf: "",
        issuedBy: "",
        tariffName: "",
        chartOfAccounts: "",
        legalEntity: "",
        birthDate: today,
        validFrom: today,
        gender: "",
        validTo: today,
        className: "",
        clientType: "",
        language: "",
        status: "active",
        address: "",
        passiveDate: today,
        counterparties_id: "",
        product_and_service_id: "",
        chart_of_accounts_id: "",
        classes_id: "",
        language_classes_id: "",
        legal_entity_id: "",
        monthlyPayment: "",
      };
    }, [initialData, dealGuid, branch?.name]);

    const {
      register,
      handleSubmit,
      control,
      getValues,
      setValue,
      reset,
      formState: { errors, isSubmitting },
    } = useForm({
      mode: "onChange",
      // reValidateMode: 'onSubmit',
      defaultValues: defaultValues,
      values: defaultValues,
    });

    const { data: contract } = useQuery({
      queryKey: ["get_contract", authStore.branch_id],
      queryFn: () =>
        apiClient.defaultUcodeFunction({
          urlMethod: "GET",
          urlParams: `/items/templates?from-ofs=true`,
        }),
      enabled: !!authStore.branch_id,
      refetchOnMount: true,
      staleTime: 0,
      cacheTime: 0,
      select: (data) => data?.data?.data?.response,
    });

    const contractData = useMemo(() => {
      const existFileContract = contract?.find((item) => item.file !== null);
      return {
        branch_id: existFileContract?.branch_id,
        guid: existFileContract?.guid,
        file: existFileContract?.file,
        company_id: existFileContract?.company_id,
        branchName: existFileContract?.branch_id_data?.name,
      };
    }, [contract]);

    useEffect(() => {
      if (!contractData.file) return;
      fetch(contractData.file)
        .then((r) => r.text())
        .then(setContractTemplate)
        .catch(() => {});
    }, [contractData.file]);

    const { mutate: createStudent, isPending } = useMutation({
      mutationKey: ["create-student"],
      mutationFn: (data) =>
        apiClient.invokeFunction({
          method: isEditMode
            ? "update_contract_with_counterparty"
            : "create_contract_with_counterparty",
          data,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["get_sales_list_simple"] });
        queryClient.invalidateQueries({
          queryKey: ["get_contract_with_counterparty"],
        });
        handleClose();
        reset();
      },
    });
    const { mutate: updateStudent, isPending: updateingStudent } = useMutation({
      mutationKey: ["update-student"],
      mutationFn: (data) =>
        apiClient.invokeFunction({
          method: "update_contract_with_counterparty_file",
          data,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["get_sales_list_simple"] });
        queryClient.invalidateQueries({
          queryKey: ["get_contract_with_counterparty"],
        });
        handleClose();
        reset();
      },
    });

    // Fetch statuses
    const { data: clasess } = useUcodeDefaultApiQuery({
      queryKey: "classes",
      urlMethod: "GET",
      urlParams: "/items/classes?from-ofs=true",
      querySetting: {
        select: (response) => response?.data?.data?.response,
        placeholder: keepPreviousData,
        staleTime: 1000 * 60 * 60,
      },
    });

    const { mutate: createClass, isPending: createClassPending } =
      useUcodeDefaultApiMutation();
    const { mutate: createGuardian, isPending: createGuardianPending } =
      useUcodeDefaultApiMutation();

    // Fetch guardian types
    const { data: guardianTypes } = useUcodeDefaultApiQuery({
      queryKey: "guardian_types",
      urlMethod: "GET",
      urlParams: "/items/guardian_type?from-ofs=true",
      querySetting: {
        select: (response) => response?.data?.data?.response,
        staleTime: 1000 * 60 * 60,
        placeholder: keepPreviousData,
      },
    });

    const guardianTypeList = useMemo(() => {
      const seen = new Set();
      return (
        guardianTypes
          ?.filter((item) => {
            if (seen.has(item.name)) return false;
            seen.add(item.name);
            return true;
          })
          .map((item) => ({
            value: item.name,
            label: item.name,
            guid: item.guid,
          })) || []
      );
    }, [guardianTypes]);

    // Fetch statuses
    const { data: language_classes } = useUcodeDefaultApiQuery({
      queryKey: "language_classes",
      urlMethod: "GET",
      urlParams: "/items/language_classes?from-ofs=true",
      querySetting: {
        select: (response) => response?.data?.data?.response,
        staleTime: 1000 * 60 * 60,
        placeholder: keepPreviousData,
      },
    });

    const classeList = useMemo(() => {
      return (
        clasess?.map((item) => ({
          value: item.guid,
          label: item.name,
          guid: item.guid,
        })) || []
      );
    }, [clasess]);

    const languageClassList = useMemo(() => {
      return (
        language_classes?.map((item) => ({
          value: item.guid,
          label: item.name,
        })) || []
      );
    }, [language_classes]);

    const handlePreview = () => {
      setStep("preview");
    };

    const handleBackToForm = () => {
      setStep("form");
    };

    // Contract data mapper for different contract types
    const getContractDataForType = () => {
      const values = getValues();
      // Get years and months difference
      const from = moment(values.validFrom).format("YYYY-MM-DD");
      const to = moment(values.validTo).format("YYYY-MM-DD");
      const totalMonths = getPeriodLength(from, to);

      const monthlyAmount = formatNumber(values.monthlyPayment);

      // totalContractPayment = total months * monthly amount
      const totalContractPayment = formatNumber(
        (totalMonths + 1) * values.monthlyPayment
      );

      // Placeholder shown in the contract when a field has no value
      const EMPTY = "____";

      // Select fields are stored as internal values ("male", "old", "passive"),
      // but the contract must show their localized labels ("Мужской", "Старый"…)
      const genderOptions = [
        { value: "male", label: t("genderMale") },
        { value: "female", label: t("genderFemale") },
      ];
      const genderLabel =
        genderOptions.find((o) => o.value === values.gender)?.label || EMPTY;
      const clientTypeLabel =
        clientType.find((o) => o.value === values.clientType)?.label || EMPTY;
      const statusLabel =
        sostayaniya.find((o) => o.value === values.status)?.label || EMPTY;

      // Resolve each value once, then expose it under BOTH the legacy template
      // variable names (${guardianPhone1}, ${studentName}, …) and the current
      // backend template names (${phone1}, ${student}, …) so either resolves.
      const passport = values.passport || EMPTY;
      const issuedBy = values.issuedBy || EMPTY;
      const phone1 = values.phone1 || EMPTY;
      const phone2 = values.phone2 || EMPTY;
      const address = values.address || EMPTY;
      const pinfl = values.pinf || EMPTY;
      const student = values.studentName || EMPTY;
      const tariff = values.tariffName || EMPTY;
      const studentClass = values.className || EMPTY;
      const branchName = values.branchName || EMPTY;
      const birthDate = values.birthDate
        ? moment(values.birthDate).format("DD.MM.YYYY")
        : EMPTY;

      const baseData = {
        contractNumber: values.contractNumber || "___",
        contractDate:
          moment(values.contractDate).format("DD.MM.YYYY") || "____-__-__",
        contractEndDate: values.validTo
          ? moment(values.validTo).format("DD.MM.YYYY")
          : "____-__-__",

        // Guardian — legacy template variable names
        guardianPassport: passport,
        guardianPassportIssuedBy: issuedBy,
        guardianPhone1: phone1,
        guardianPhone2: phone2,
        guardianAddress: address,
        guardianPinfl: pinfl,
        // Guardian — current backend template variable names
        passport,
        issuedBy,
        phone1,
        phone2,
        address,
        pinfl,

        // Student — legacy + current names
        studentName: student,
        student,
        studentBirthday: birthDate,
        birthDate,
        className: studentClass,
        studentClass,
        gender: genderLabel,

        // Tariff — legacy + current names
        tariffName: tariff,
        tariff,

        guardianType: values.guardianType || EMPTY,
        chartOfAccounts: values.chartOfAccounts || "______",
        legalEntity: values.legalEntity || "______",
        monthlyPayment: monthlyAmount,
        yearlyPayment: totalContractPayment,
        guardianName: values.guardianName || EMPTY,
        academicYear: values.academicYear || "2025-2026",
        language: values.language || "O'zbek tili",

        // Organization
        branchName,
        clientType: clientTypeLabel,
        status: statusLabel,

        validFrom: values.validFrom
          ? moment(values.validFrom).format("MMM, DD YYYY")
          : "____-__-__",
        validTo: values.validTo
          ? moment(values.validTo).format("MMM, DD YYYY")
          : "____-__-__",
      };

      return baseData;
    };

    const getContractHtml = () => {
      // if (initialData && !canUpdateForms) return initialData?.contract_file
      // if (initialData && !canUpdateForms) return initialData?.contract_file
      if (!contractTemplate)
        return '<p style="padding:20px;font-family:sans-serif">Загрузка шаблона договора...</p>';
      const data = getContractDataForType();
      return Object.entries(data).reduce(
        (html, [key, value]) =>
          html.replaceAll(`\${${key}}`, String(value ?? "")),
        contractTemplate
      );
    };

    const handleClose = () => {
      setStep("form");
      onClose();
    };

    const handleFormSubmit = async (data) => {
      // Helper to wrap value in array or return empty array
      const toArray = (val) => (val ? [val] : []);

      // Generate contract HTML with filled data based on active contract type

      let contractFileLink = "";
      setIsSaving(true);

      let requestData = {};

      // Пассивный договор редактировать нельзя — страховка, если UI обойдут
      if (isPassiveContract) {
        setIsSaving(false);
        return;
      }

      const htmlContent = getContractHtml()
        .replace(/\s*highlight\s*/g, " ")
        .replace(/\s+/g, " ");

      try {
        // Step 1: Convert HTML to PDF
        const convertResponse = await fetch(
          "https://api.admin.u-code.io/v2/html/convert?project-id=3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authStore.authToken}`,
            },
            body: JSON.stringify({
              html_content: htmlContent,
              output_format: "pdf",
            }),
          }
        );

        if (!convertResponse.ok) {
          throw new Error("Failed to convert HTML to PDF");
        }

        const pdfBlob = await convertResponse.blob();

        // Step 2: Upload PDF file
        const formData = new FormData();
        formData.append("file", pdfBlob, "contract.pdf");

        const uploadResponse = await fetch(
          "https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authStore.authToken}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload PDF file");
        }

        const uploadData = await uploadResponse.json();
        const fileLink = uploadData?.data?.link;

        if (fileLink) {
          contractFileLink = `https://cdn.u-code.io/${fileLink}`;
        }
      } catch (error) {
        console.error("Error processing contract file:", error);
        showErrorNotification(
          "Ошибка при обработке договора: " + error.message
        );
        return;
      } finally {
        setIsSaving(false);
      }

      // Поля, доступные для изменения у активного договора
      const contractFields = {
        name: data.contractNumber || "",
        number_contract: data.contractNumber || "",
        school_year: data.academicYear,
        date_contract: moment(data.contractDate).format("YYYY-MM-DD"),
        deal_date: moment(data.contractDate).format("YYYY-MM-DD"),
        full_name_guardian: data.guardianName || "",
        type_guardian: toArray(data.guardianType),
        address: data.address || "",
        first_phone_number: cleanPhone(data.phone1),
        second_phone_number: cleanPhone(data.phone2),
        number_passport: data.passport || "",
        jshshr_guardian: data.pinf || "",
        place_of_issue: data.issuedBy || "",
        html: htmlContent,
        contract_file: contractFileLink,
        birthday_pupil: data.birthDate
          ? moment(data.birthDate).format("YYYY-MM-DD")
          : null,
        select_gender: toArray(data.gender),
        classes_id: data.classes_id,
        pupil_type: toArray(data.clientType),
        language_classes_id: data.language_classes_id,
      };

      const passiveDate = data.passiveDate
        ? moment(data.passiveDate).format("YYYY-MM-DD")
        : null;

      if (isEditMode) {
        requestData = {
          guid: initialData.guid,
          ...contractFields,
          passive_date: passiveDate,
        };
      } else {
        // Поля, которые задаются только при создании договора
        requestData = {
          ...contractFields,
          the_contract_period_is_from: moment(data.validFrom).format(
            "YYYY-MM-DD"
          ),
          the_contract_period_is_to: moment(data.validTo).format("YYYY-MM-DD"),
          counterparties_id: data.counterparties_id || "",
          product_and_service_id: data.product_and_service_id,
          chart_of_accounts_id: data.chart_of_accounts_id,
          legal_entity_id: data?.legal_entity_id || null,
          status: toArray(data.status),
          passive_date: passiveDate,
        };
      }

      createStudent(requestData, {
        onSuccess: () => {
          showSuccessNotification(
            isEditMode ? "Договор успешно обновлён" : "Ученик успешно создан"
          );
          setStep("form");
          onClose();
          handleClose();
        },
        onError: (error) => {
          showErrorNotification(
            error?.message ||
              (isEditMode
                ? "Ошибка при обновлении договора"
                : "Ошибка при создании ученика")
          );
        },
      });
    };

    // Форма прошла валидацию: и при создании, и при обновлении сначала просим
    // подтвердить, что договор проверили в предпросмотре
    const handleValidSubmit = (data) => {
      setPendingSubmitData(data);
    };

    const handleConfirmSubmit = () => {
      const data = pendingSubmitData;
      setPendingSubmitData(null);
      if (data) handleFormSubmit(data);
    };

    // never change this btn submit funtionolities. Because this is only  developer
    const handleFormUpdateSubmit = async () => {
      let contractFileLink = "";

      try {
        // Generate new contract HTML with updated values
        const htmlContent = getContractHtml()
          .replace(/\s*highlight\s*/g, " ")
          .replace(/\s+/g, " ");

        // Step 1: Convert HTML to PDF
        const convertResponse = await fetch(
          "https://api.admin.u-code.io/v2/html/convert?project-id=3ed54a59-5eda-4cfe-b4ae-8a201c1ea4ed",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authStore.authToken}`,
            },
            body: JSON.stringify({
              html_content: htmlContent,
              output_format: "pdf",
            }),
          }
        );

        if (!convertResponse.ok) {
          throw new Error("Failed to convert HTML to PDF");
        }

        const pdfBlob = await convertResponse.blob();

        // Step 2: Upload PDF file
        const formData = new FormData();
        formData.append("file", pdfBlob, "contract.pdf");

        const uploadResponse = await fetch(
          "https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authStore.authToken}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload PDF file");
        }

        const uploadData = await uploadResponse.json();
        const fileLink = uploadData?.data?.link;

        if (fileLink) {
          contractFileLink = `https://cdn.u-code.io/${fileLink}`;
        }
      } catch (error) {
        console.error("Error processing contract file:", error);
        showErrorNotification(
          "Ошибка при обработке договора: " + error.message
        );
        setIsSaving(false);
        return;
      }

      const requestData = {
        guid: initialData?.guid,
        sales_transactions_id: initialData?.sales_transactions_id,
        file: contractFileLink,
      };

      updateStudent(requestData, {
        onSuccess: () => {
          showSuccessNotification("Договор успешно обновлен");
          setStep("form");
          onClose();
          handleClose();
        },
        onError: (error) => {
          showErrorNotification(
            error?.message || "Ошибка при обновлении договора"
          );
        },
      });

      setIsSaving(false);
    };

    const html = getContractHtml();

    const handleSaveClass = () => {
      if (!classNameInput.trim()) return;

      if (classModalMode === "create") {
        // POST - Create new
        createClass(
          {
            urlMethod: "POST",
            urlParams: "/items/classes",
            data: {
              name: classNameInput,
              branch_id: authStore.branch_id,
            },
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["classes"] });
              setOpenClassModal(false);
              setClassNameInput("");
              showSuccessNotification(t("classCreated"));
            },
            onError: (error) => {
              showErrorNotification(error?.message || t("classCreateError"));
            },
          }
        );
      } else if (classModalMode === "edit" && editingClass) {
        // PUT - Update existing
        createClass(
          {
            urlMethod: "PUT",
            urlParams: `/items/classes/${editingClass.value}`,
            data: {
              name: classNameInput,
              branch_id: authStore.branch_id,
              guid: editingClass.guid,
            },
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["classes"] });
              setOpenClassModal(false);
              setEditingClass(null);
              setClassNameInput("");
              showSuccessNotification(t("classUpdated"));
            },
            onError: (error) => {
              showErrorNotification(error?.message || t("classUpdateError"));
            },
          }
        );
      }
    };

    const handleDeleteClass = () => {
      if (!deleteConfirmItem) return;

      createClass(
        {
          urlMethod: "DELETE",
          urlParams: `/items/classes/${deleteConfirmItem.value}`,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes"] });
            setDeleteConfirmItem(null);
            showSuccessNotification(t("classDeleted"));
          },
          onError: (error) => {
            showErrorNotification(error?.message || t("classDeleteError"));
          },
        }
      );
    };

    const openCreateModal = () => {
      setClassModalMode("create");
      setEditingClass(null);
      setClassNameInput("");
      setOpenClassModal(true);
    };

    const openEditModal = (item) => {
      setClassModalMode("edit");
      setEditingClass(item);
      setClassNameInput(item.label);
      setOpenClassModal(true);
    };

    const openDeleteModal = (item) => {
      setDeleteConfirmItem(item);
    };

    // Guardian type CRUD handlers
    const handleSaveGuardianType = () => {
      if (!guardianTypeInput.trim()) return;

      if (guardianModalMode === "create") {
        // POST - Create new
        createGuardian(
          {
            urlMethod: "POST",
            urlParams: "/items/guardian_type",
            data: {
              name: guardianTypeInput,
              branch_id: authStore.branch_id,
            },
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["guardian_types"] });
              setOpenGuardianModal(false);
              setGuardianTypeInput("");
              showSuccessNotification(t("guardianTypeCreated"));
            },
            onError: (error) => {
              showErrorNotification(
                error?.message || t("guardianTypeCreateError")
              );
            },
          }
        );
      } else if (guardianModalMode === "edit" && editingGuardian) {
        // PUT - Update existing
        createGuardian(
          {
            urlMethod: "PUT",
            urlParams: `/items/guardian_type/${editingGuardian.value}`,
            data: {
              name: guardianTypeInput,
              branch_id: authStore.branch_id,
              guid: editingGuardian.guid,
            },
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["guardian_types"] });
              setOpenGuardianModal(false);
              setEditingGuardian(null);
              setGuardianTypeInput("");
              showSuccessNotification(t("guardianTypeUpdated"));
            },
            onError: (error) => {
              showErrorNotification(
                error?.message || t("guardianTypeUpdateError")
              );
            },
          }
        );
      }
    };

    const handleDeleteGuardianType = () => {
      if (!deleteGuardianItem) return;

      createGuardian(
        {
          urlMethod: "DELETE",
          urlParams: `/items/guardian_type/${deleteGuardianItem.value}`,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["guardian_types"] });
            setDeleteGuardianItem(null);
            showSuccessNotification(t("guardianTypeDeleted"));
          },
          onError: (error) => {
            showErrorNotification(
              error?.message || t("guardianTypeDeleteError")
            );
          },
        }
      );
    };

    const openCreateGuardianModal = () => {
      setGuardianModalMode("create");
      setEditingGuardian(null);
      setGuardianTypeInput("");
      setOpenGuardianModal(true);
    };

    const openEditGuardianModal = (item) => {
      setGuardianModalMode("edit");
      setEditingGuardian(item);
      setGuardianTypeInput(item.label);
      setOpenGuardianModal(true);
    };

    const openDeleteGuardianModal = (item) => {
      setDeleteGuardianItem(item);
    };

    return (
      <>
        <CustomDialog
          contentClass={`h-[80vh] ${
            step === "preview" ? "min-w-[900px]!" : "min-w-[1000px]!"
          } p-0 overflow-hidden flex flex-col`}
          open={isOpen}
          onClose={handleClose}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-4">
            <h2 className="text-lg font-bold text-gray-900 font-sans">
              {step === "form"
                ? initialData
                  ? t("titleEditSale")
                  : t("titleNewSale")
                : t("titlePreview")}
            </h2>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader />
            </div>
          ) : (
            <>
              {step === "form" ? (
                <>
                  {/* Scrollable Form */}
                  <div className="flex-1 overflow-auto p-4">
                    <form
                      id="student-form"
                      onSubmit={handleSubmit(handleValidSubmit)}
                      className="grid grid-cols-3 gap-3"
                    >
                      <fieldset className="contents">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("contractNumber")} *
                          </label>
                          <Input
                            placeholder={t("contractNumberPlaceholder")}
                            error={!!errors.contractNumber}
                            {...register("contractNumber", {
                              required: !isEditableLocked
                                ? t("contractNumberRequired")
                                : false,
                            })}
                            disabled={isEditableLocked}
                          />
                          {/* {errors.contractNumber && <span className="text-xs text-red-500">{errors.contractNumber.message}</span>} */}
                        </div>
                        {/* Row 1 */}
                        <div className="flex flex-col gap-1.5 focus-within:text-blue-600">
                          <label className="text-xs font-medium text-gray-700">
                            {t("contractDate")} *
                          </label>
                          <Controller
                            name="contractDate"
                            control={control}
                            rules={{
                              required: isEditableLocked
                                ? false
                                : "Выберите дату договора",
                            }}
                            render={({ field }) => {
                              return (
                                <FormDatepicker
                                  value={field.value}
                                  onChange={(value) =>
                                    field.onChange(
                                      moment(value).format("YYYY-MM-DD")
                                    )
                                  }
                                  format="YYYY-MM-DD"
                                  placeholder="Выберите дату"
                                  className={"w-full!"}
                                  inputClass={"bg-white!"}
                                  disabled={isEditableLocked}
                                />
                              );
                            }}
                          />
                          {/* {errors.contractDate && <span className="text-xs text-red-500">{errors.contractDate.message}</span>} */}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("guardianName")} *
                          </label>
                          <Input
                            placeholder={t("guardianNamePlaceholder")}
                            error={!!errors.guardianName}
                            {...register("guardianName", {
                              required: !isEditableLocked
                                ? t("guardianNameRequired")
                                : false,
                            })}
                            disabled={isEditableLocked}
                          />
                          {/* {errors.guardianName && <span className="text-xs text-red-500">{errors.guardianName.message}</span>} */}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("branchName")}
                          </label>
                          <Controller
                            name="branchName"
                            control={control}
                            render={({ field }) => (
                              <Input
                                placeholder={t("branchName")}
                                value={field.value}
                                disabled
                              />
                            )}
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("guardianType")} *
                          </label>
                          <Controller
                            name="guardianType"
                            control={control}
                            rules={{
                              required: !isEditableLocked ? true : false,
                            }}
                            render={({ field }) => (
                              <SingleSelect
                                placeholder={t("guardianTypePlaceholder")}
                                value={field.value}
                                customButton={
                                  <div
                                    onClick={openCreateGuardianModal}
                                    className="flex cursor-pointer items-center gap-2 px-3 py-2"
                                  >
                                    <span className="text-sm text-primary">
                                      {t("addGuardianType")}
                                    </span>
                                  </div>
                                }
                                onChange={field.onChange}
                                elementAfter={(item) => (
                                  <div className="flex items-center gap-2">
                                    <Edit2
                                      size={18}
                                      className="cursor-pointer hover:text-blue-600"
                                      onClick={() =>
                                        openEditGuardianModal(item)
                                      }
                                    />
                                    <Trash2
                                      size={18}
                                      className="text-red-500 cursor-pointer hover:text-red-700"
                                      onClick={() =>
                                        openDeleteGuardianModal(item)
                                      }
                                    />
                                  </div>
                                )}
                                hasError={errors.guardianType}
                                data={guardianTypeList}
                                className="bg-white"
                                isClearable={false}
                                disabled={isEditableLocked}
                              />
                            )}
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("academicYear")} *
                          </label>
                          <Controller
                            name="academicYear"
                            control={control}
                            rules={{
                              required: !isEditableLocked
                                ? t("academicYearRequired")
                                : false,
                            }}
                            render={({ field }) => (
                              <SingleSelect
                                placeholder={t("academicYearPlaceholder")}
                                value={field.value}
                                onChange={field.onChange}
                                data={academicYears}
                                className="bg-white"
                                hasError={errors.academicYear}
                                isClearable={false}
                                disabled={isEditableLocked}
                              />
                            )}
                          />
                          {/* {errors.academicYear && <span className="text-xs text-red-500">{errors.academicYear.message}</span>} */}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("phone1")} *
                          </label>
                          <Controller
                            name="phone1"
                            control={control}
                            rules={{
                              required: !isEditableLocked
                                ? t("phone1Required")
                                : false,
                            }}
                            render={({ field }) => (
                              <div className="flex">
                                <Input
                                  type="text"
                                  placeholder={t("phone1Placeholder")}
                                  value={field.value}
                                  disabled={isEditableLocked}
                                  hasError={errors.phone1}
                                  onChange={(e) =>
                                    field.onChange(
                                      formatPhoneNumber(e.target.value)
                                    )
                                  }
                                />
                              </div>
                            )}
                          />
                        </div>

                        {/* Row 3 */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("studentName")} *
                          </label>
                          <Controller
                            name="counterparties_id"
                            control={control}
                            rules={{ required: !isFixedLocked ? true : false }}
                            render={({ field }) => (
                              <SingleCounterParty
                                placeholder={t("studentNamePlaceholder")}
                                value={field.value}
                                name="nazvanie"
                                returnChartOfAccount={(value) =>
                                  setValue("studentName", value)
                                }
                                onChange={field.onChange}
                                className={"bg-white"}
                                isClearable={false}
                                hasError={errors.counterparties_id}
                                disabled={isFixedLocked}
                              />
                            )}
                          />
                          {/* {errors.counterparties_id && <span className="text-xs text-red-500">{errors.counterparties_id.message}</span>} */}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("phone2")}
                          </label>
                          <Controller
                            name="phone2"
                            control={control}
                            render={({ field }) => (
                              <div className="flex">
                                <Input
                                  type="text"
                                  placeholder={t("phone2Placeholder")}
                                  value={field.value}
                                  disabled={isEditableLocked}
                                  onChange={(e) =>
                                    field.onChange(
                                      formatPhoneNumber(e.target.value)
                                    )
                                  }
                                />
                              </div>
                            )}
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("passport")} *
                          </label>
                          <Input
                            placeholder={t("passportPlaceholder")}
                            error={!!errors.passport}
                            {...register("passport", {
                              required: !isEditableLocked
                                ? t("passportRequired")
                                : false,
                            })}
                            disabled={isEditableLocked}
                          />
                          {/* {errors.passport && <span className="text-xs text-red-500">{errors.passport.message}</span>} */}
                        </div>

                        {/* Row 4 */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("pinfl")} *
                          </label>
                          <Input
                            placeholder={t("pinflPlaceholder")}
                            maxLength={14}
                            disabled={isEditableLocked}
                            error={!!errors.pinf}
                            {...register("pinf", {
                              required: !isEditableLocked
                                ? t("pinflRequired")
                                : false,
                              pattern: {
                                value: /^\d{14}$/,
                                message: t("pinflInvalid"),
                              },
                            })}
                          />
                          {/* {errors.pinf && <span className="text-xs text-red-500">{errors.pinf.message}</span>} */}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("issuedBy")} *
                          </label>
                          <Input
                            placeholder={t("issuedByPlaceholder")}
                            disabled={isEditableLocked}
                            error={!!errors.issuedBy}
                            {...register("issuedBy", {
                              required: !isEditableLocked
                                ? t("issuedByRequired")
                                : false,
                            })}
                          />
                          {/* {errors.issuedBy && <span className="text-xs text-red-500">{errors.issuedBy.message}</span>} */}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("tariffName")}*
                          </label>
                          <Controller
                            name="product_and_service_id"
                            control={control}
                            rules={{ required: !isFixedLocked ? true : false }}
                            render={({ field }) => (
                              <SelectProductService
                                value={field.value}
                                onChange={field.onChange}
                                name="tsena_za_ed"
                                returnFieldValue={(value) => {
                                  setValue("monthlyPayment", value);
                                }}
                                returnName={(name) => {
                                  setValue("tariffName", name);
                                }}
                                hasError={!!errors.product_and_service_id}
                                placeholder={t("tariffPlaceholder")}
                                className={"w-full! bg-white"}
                                disabled={isFixedLocked}
                              />
                            )}
                          />
                        </div>

                        {/* Row 5 */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("birthDate")} *
                          </label>
                          <Controller
                            name="birthDate"
                            control={control}
                            rules={{
                              required: !isEditableLocked
                                ? t("birthDateRequired")
                                : false,
                            }}
                            render={({ field }) => (
                              <FormDatepicker
                                value={field.value}
                                onChange={(value) =>
                                  field.onChange(
                                    moment(value).format("YYYY-MM-DD")
                                  )
                                }
                                placeholder={t("datePlaceholder")}
                                format="YYYY-MM-DD"
                                className={"w-full!"}
                                inputClass={"bg-white!"}
                                disabled={isEditableLocked}
                              />
                            )}
                          />
                          {/* {errors.birthDate && <span className="text-xs text-red-500">{errors.birthDate.message}</span>} */}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("validFrom")} *
                          </label>
                          <Controller
                            name="validFrom"
                            control={control}
                            rules={{
                              required: !isFixedLocked
                                ? t("validFromRequired")
                                : false,
                            }}
                            render={({ field }) => (
                              <FormDatepicker
                                value={field.value}
                                onChange={(value) => {
                                  const dateString =
                                    moment(value).format("YYYY-MM-DD");
                                  field.onChange(dateString);
                                  setValue(
                                    "the_contract_period_is_from",
                                    dateString
                                  );
                                }}
                                placeholder={t("datePlaceholder")}
                                format="YYYY-MM-DD"
                                className={"w-full!"}
                                inputClass={"bg-white!"}
                                disabled={isFixedLocked}
                              />
                            )}
                          />
                          {/* {errors.validFrom && <span className="text-xs text-red-500">{errors.validFrom.message}</span>} */}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("gender")} *
                          </label>
                          <Controller
                            name="gender"
                            control={control}
                            rules={{
                              required: !isEditableLocked ? true : false,
                            }}
                            render={({ field }) => (
                              <SingleSelect
                                placeholder={t("gender")}
                                value={field.value}
                                onChange={field.onChange}
                                data={[
                                  { value: "male", label: t("genderMale") },
                                  { value: "female", label: t("genderFemale") },
                                ]}
                                className="bg-white"
                                isClearable={false}
                                hasError={errors.gender}
                                disabled={isEditableLocked}
                              />
                            )}
                          />
                          {/* {errors.gender && <span className="text-xs text-red-500">{errors.gender.message}</span>} */}
                        </div>
                        {/* Row 6 */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("validTo")} *
                          </label>
                          <Controller
                            name="validTo"
                            control={control}
                            rules={{
                              required: !isFixedLocked
                                ? t("validToRequired")
                                : false,
                            }}
                            render={({ field }) => (
                              <FormDatepicker
                                value={field.value}
                                onChange={(value) => {
                                  const dateString =
                                    moment(value).format("YYYY-MM-DD");
                                  field.onChange(dateString);
                                  setValue(
                                    "the_contract_period_is_to",
                                    dateString
                                  );
                                }}
                                placeholder={t("datePlaceholder")}
                                format="YYYY-MM-DD"
                                className={"w-full!"}
                                inputClass={"bg-white!"}
                                disabled={isFixedLocked}
                              />
                            )}
                          />
                          {/* {errors.validTo && <span className="text-xs text-red-500">{errors.validTo.message}</span>} */}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("class")} *
                          </label>
                          <Controller
                            name="classes_id"
                            control={control}
                            rules={{
                              required: !isEditableLocked ? true : false,
                            }}
                            render={({ field }) => (
                              <SingleSelect
                                placeholder={t("classPlaceholder")}
                                value={field.value}
                                customButton={
                                  <div
                                    onClick={openCreateModal}
                                    className="flex cursor-pointer items-center gap-2 px-3 py-2"
                                  >
                                    <span className="text-sm text-primary">
                                      {t("addClass")}
                                    </span>
                                  </div>
                                }
                                onChange={(value) => {
                                  field.onChange(value);
                                  const name = clasess.find(
                                    (l) => l.guid === value
                                  )?.name;
                                  setValue("className", name);
                                }}
                                elementAfter={(item) => (
                                  <div className="flex items-center gap-2">
                                    <Edit2
                                      size={18}
                                      className="cursor-pointer hover:text-blue-600"
                                      onClick={() => openEditModal(item)}
                                    />
                                    <Trash2
                                      size={18}
                                      className="text-red-500 cursor-pointer hover:text-red-700"
                                      onClick={() => openDeleteModal(item)}
                                    />
                                  </div>
                                )}
                                hasError={errors.classes_id}
                                data={classeList}
                                isClearable={false}
                                className="bg-white"
                                disabled={isEditableLocked}
                              />
                            )}
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("clientType")}
                          </label>
                          <Controller
                            name="clientType"
                            control={control}
                            render={({ field }) => (
                              <SingleSelect
                                placeholder={t("clientTypePlaceholder")}
                                value={field.value}
                                onChange={field.onChange}
                                data={clientType}
                                className="bg-white"
                                isClearable={false}
                                disabled={isEditableLocked}
                              />
                            )}
                          />
                        </div>
                      </fieldset>

                      {/* Row 7 */}
                      {isEditMode && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("passiveDate")} *
                          </label>
                          <Controller
                            name="passiveDate"
                            control={control}
                            rules={{ required: t("passiveDateRequired") }}
                            render={({ field }) => (
                              <FormDatepicker
                                value={field.value}
                                onChange={(value) =>
                                  field.onChange(
                                    moment(value).format("YYYY-MM-DD")
                                  )
                                }
                                minDate={new Date(defaultValues.validFrom)}
                                maxDate={new Date(defaultValues.validTo)}
                                disabled={isPassiveContract}
                                placeholder={t("datePlaceholder")}
                                format="YYYY-MM-DD"
                                className={
                                  "w-full! bg-white px-2  py-1 border border-gray-ucode-200!"
                                }
                                inputClass={`bg-white! ${
                                  errors?.passiveDate?.message &&
                                  " border border-red-ucode!"
                                }`}
                              />
                            )}
                          />
                        </div>
                      )}

                      <fieldset
                        disabled
                        className="contents pointer-events-none opacity-70"
                      >
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("status")}
                          </label>
                          <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                              <SingleSelect
                                placeholder={t("statusPlaceholder")}
                                value={field.value}
                                onChange={field.onChange}
                                data={sostayaniya}
                                className="bg-white"
                                isClearable={false}
                                disabled
                              />
                            )}
                          />
                        </div>
                      </fieldset>

                      <fieldset
                        disabled={isEditableLocked}
                        className={`contents ${
                          isEditableLocked
                            ? "pointer-events-none opacity-70"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("address")} *
                          </label>
                          <Input
                            placeholder={t("addressPlaceholder")}
                            error={!!errors.address}
                            disabled={isEditableLocked}
                            {...register("address", {
                              required: !isEditableLocked
                                ? t("addressRequired")
                                : false,
                            })}
                          />
                          {/* {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>} */}
                        </div>

                        {/* Row 8 */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("language")} *
                          </label>
                          <Controller
                            name="language_classes_id"
                            control={control}
                            rules={{
                              required: !isEditableLocked ? true : false,
                            }}
                            render={({ field }) => (
                              <SingleSelect
                                placeholder={t("languagePlaceholder")}
                                value={field.value}
                                onChange={(value) => {
                                  field.onChange(value);
                                  const name = language_classes.find(
                                    (l) => l.guid === value
                                  )?.name;
                                  setValue(
                                    "language",
                                    String(name).toUpperCase()
                                  );
                                }}
                                data={languageClassList}
                                className="bg-white"
                                hasError={errors.language_classes_id}
                                isClearable={false}
                                disabled={isEditableLocked}
                              />
                            )}
                          />
                          {/* {errors.language_classes_id && <span className="text-xs text-red-500">{errors.language_classes_id.message}</span>} */}
                        </div>
                      </fieldset>

                      <fieldset
                        disabled={isFixedLocked}
                        className={`contents ${
                          isFixedLocked ? "pointer-events-none opacity-70" : ""
                        }`}
                      >
                        {/* Row 9 */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("chartOfAccounts")}
                          </label>
                          <Controller
                            name="chart_of_accounts_id"
                            control={control}
                            render={({ field }) => (
                              <SinglSelectStatiya
                                selectedValue={field.value}
                                setSelectedValue={field.onChange}
                                handleReturnName={(name) => {
                                  setValue("chartOfAccounts", name);
                                }}
                                placeholder={t("undistributedIncome")}
                                className=" bg-white"
                                isClearable={false}
                                disabled={isFixedLocked}
                              />
                            )}
                          />
                        </div>
                        {/* Row 10 */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-700">
                            {t("legalEntity")} *
                          </label>
                          <Controller
                            name="legal_entity_id"
                            control={control}
                            rules={{
                              required: !isFixedLocked
                                ? t("legalEntityRequired")
                                : false,
                            }}
                            render={({ field }) => (
                              <SelectLegelEntitties
                                value={field.value}
                                onChange={field.onChange}
                                returnLabel={(name) => {
                                  setValue("legalEntity", name);
                                }}
                                placeholder={t("legalEntityPlaceholder")}
                                className=" bg-white"
                                isClearable={false}
                                hasError={errors.legal_entity_id}
                                disabled={isFixedLocked}
                              />
                            )}
                          />
                          {/* {errors.legal_entity_id && <span className="text-xs text-red-500">{errors.legal_entity_id.message}</span>} */}
                        </div>
                      </fieldset>
                    </form>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-3 p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                    <button
                      type="button"
                      className="px-5 py-2 border cursor-pointer border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      onClick={handleClose}
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handlePreview}
                      className="px-5 py-2 bg-emerald-600 cursor-pointer hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                    >
                      {t("preview")}
                    </button>
                    {!isPassiveContract && (
                      <button
                        type="submit"
                        form="student-form"
                        disabled={isSubmitting || isSaving || isPending}
                        className="px-5 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting || isSaving || isPending
                          ? t("saving")
                          : isEditMode
                          ? t("update")
                          : t("add")}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Contract Preview */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-hidden">
                      <iframe
                        srcDoc={html}
                        className="w-full h-full border-0 px-2"
                        title={t("showContractPreview")}
                      />
                    </div>
                  </div>

                  {/* Preview Footer */}
                  <div className="flex items-center justify-between gap-3 p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                    <button
                      type="button"
                      onClick={handleFormUpdateSubmit}
                      className="px-5 py-2 hover:border hover:border-gray-400 cursor-pointer rounded-md text-sm font-medium text-gray-700  hover:bg-gray-50 transition-colors"
                    >
                      &nbsp;{" "}
                      {updateingStudent && <Loader2 className="animate-spin" />}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleBackToForm}
                        className="px-5 py-2 border border-gray-200 cursor-pointer rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        {t("back")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const iframe = document.querySelector(
                            'iframe[title="Предпросмотр договора"]'
                          );
                          if (iframe) iframe.contentWindow.print();
                        }}
                        className="px-5 py-2 bg-emerald-600 cursor-pointer hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                      >
                        {t("print")}
                      </button>
                      {!isPassiveContract && (
                        <button
                          type="submit"
                          form="student-form"
                          disabled={isSubmitting || isSaving || isPending}
                          className="px-5 py-2 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting || isSaving || isPending
                            ? t("saving")
                            : isEditMode
                            ? t("update")
                            : t("add")}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CustomDialog>

        {/* Class Create/Edit Modal */}
        <CustomDialog
          open={openClassModal}
          onClose={() => setOpenClassModal(false)}
          contentClass="min-w-[400px] p-6"
        >
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {classModalMode === "create" ? t("createClass") : t("editClass")}
            </h3>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                {t("className")}
              </label>
              <Input
                value={classNameInput}
                onChange={(e) => setClassNameInput(e.target.value)}
                placeholder={t("classNamePlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpenClassModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSaveClass}
                disabled={!classNameInput.trim()}
                className="px-4 py-2 bg-blue-600 flex items-center gap-1 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {classModalMode === "create" ? t("create") : t("save")}
                {createClassPending && <Loader />}
              </button>
            </div>
          </div>
        </CustomDialog>

        {/* Delete Confirmation Modal */}
        {/* Подтверждение обновления договора */}
        <CustomDialog
          open={!!pendingSubmitData}
          onClose={() => setPendingSubmitData(null)}
          elevated
          overlayClass="bg-slate-950/55! animate-in fade-in duration-200"
          contentClass="w-[460px] max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex gap-4 p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Eye size={22} />
            </div>
            <div className="flex flex-col gap-1.5 pt-0.5">
              <h3 className="text-base font-semibold text-gray-900">
                {isEditMode ? t("updateConfirmation") : t("createConfirmation")}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                {isEditMode ? t("updateConfirmText") : t("createConfirmText")}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <button
              type="button"
              onClick={() => setPendingSubmitData(null)}
              className="px-5 py-2 cursor-pointer rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              className="px-5 py-2 cursor-pointer rounded-md bg-blue-600 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              {isEditMode ? t("update") : t("add")}
            </button>
          </div>
        </CustomDialog>

        <CustomDialog
          open={!!deleteConfirmItem}
          onClose={() => setDeleteConfirmItem(null)}
          contentClass="min-w-[400px] p-6"
        >
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("deleteConfirmation")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("deleteClassConfirm", { name: deleteConfirmItem?.label })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDeleteClass}
                className="px-4 py-2 bg-red-600 flex items-center gap-1 text-white rounded-md text-sm hover:bg-red-700"
              >
                {t("delete")}
                {createClassPending && <Loader />}
              </button>
            </div>
          </div>
        </CustomDialog>

        {/* Guardian Type Create/Edit Modal */}
        <CustomDialog
          open={openGuardianModal}
          onClose={() => setOpenGuardianModal(false)}
          contentClass="min-w-[400px] p-6"
        >
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {guardianModalMode === "create"
                ? t("createGuardianType")
                : t("editGuardianType")}
            </h3>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                {t("guardianTypeName")}
              </label>
              <Input
                value={guardianTypeInput}
                onChange={(e) => setGuardianTypeInput(e.target.value)}
                placeholder={t("guardianTypeNamePlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpenGuardianModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSaveGuardianType}
                disabled={!guardianTypeInput.trim()}
                className="px-4 py-2 bg-blue-600 flex items-center gap-1 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {guardianModalMode === "create" ? t("create") : t("save")}
                {createGuardianPending && <Loader />}
              </button>
            </div>
          </div>
        </CustomDialog>

        {/* Guardian Type Delete Confirmation Modal */}
        <CustomDialog
          open={!!deleteGuardianItem}
          onClose={() => setDeleteGuardianItem(null)}
          contentClass="min-w-[400px] p-6"
        >
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("deleteConfirmation")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("deleteGuardianConfirm", { name: deleteGuardianItem?.label })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteGuardianItem(null)}
                className="px-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDeleteGuardianType}
                className="px-4 py-2 bg-red-600 flex items-center gap-1 text-white rounded-md text-sm hover:bg-red-700"
              >
                {t("delete")}
                {createGuardianPending && <Loader />}
              </button>
            </div>
          </div>
        </CustomDialog>
      </>
    );
  }
);

export default CreateStudentModal;
