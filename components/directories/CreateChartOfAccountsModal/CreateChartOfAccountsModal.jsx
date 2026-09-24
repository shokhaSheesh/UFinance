"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { CategoryTypeTabs } from "@/components/directories/CategoryTypes"
import SelectStatiya from "@/components/ReadyComponents/SelectStatiya"
import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from "@/components/shared/CustomDialog"
import Input from "@/components/shared/Input"
import TextArea from "@/components/shared/TextArea"
import { useUcodeRequestMutation, useUpdateChartOfAccounts } from "@/hooks/useDashboard"
import { authStore } from "@/store/auth.store"

// Hardcoded mapping for API - API expects Russian tip values
const TAB_TO_API_TIP = {
  income: "Доходы",
  expense: "Расходы",
  assets: "Актив",
  liabilities: "Обязательства",
  capital: "Капитал",
}

const API_TIP_TO_TAB = {
  "Доходы": "income",
  "Расходы": "expense",
  "Актив": "assets",
  "Обязательства": "liabilities",
  "Капитал": "capital",
}

export default function CreateChartOfAccountsModal({
  isOpen,
  onClose,
  initialTab = "income",
  parentCategory = null,
  category = null,
}) {
  const t = useTranslations("Directories.chartOfAccounts")
  const tc = useTranslations("Common")

  const isEditMode = Boolean(category?.guid)
  const queryClient = useQueryClient()

  // Use hardcoded mappings for API compatibility
  const tabToTipMap = TAB_TO_API_TIP
  const tipToTabMap = API_TIP_TO_TAB

  const [activeTab, setActiveTab] = useState(initialTab)

  const { mutateAsync: createAccount } = useUcodeRequestMutation()
  const updateMutation = useUpdateChartOfAccounts()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nazvanie: "",
      chart_of_accounts_id_2: "",
      komentariy: "",
    },
  })

  // Initialize form when modal opens
  useEffect(() => {
    if (!isOpen) return

    if (isEditMode) {
      const categoryTip = category.tip?.[0] ?? "Доходы"
      const tabKey = tipToTabMap[categoryTip] ?? "income"
      // Defer state updates to avoid cascading renders
      Promise.resolve().then(() => {
        setActiveTab(tabKey)
        reset({
          nazvanie: category.name ?? "",
          chart_of_accounts_id_2: category.chart_of_accounts_id_2 ?? "",
          komentariy: category.komentariy ?? "",
        })
      })
    } else {
      Promise.resolve().then(() => {
        setActiveTab(initialTab)
        reset({
          nazvanie: "",
          chart_of_accounts_id_2: parentCategory?.guid ?? "",
          komentariy: "",
        })
      })
    }
  }, [isOpen, isEditMode, category, initialTab, parentCategory, reset, t])

  const buildSubmitData = (data) => {
    const baseData = {
      nazvanie: data.nazvanie.trim(),
      tip: [tabToTipMap[activeTab]],
      ...(data.chart_of_accounts_id_2 && { chart_of_accounts_id_2: data.chart_of_accounts_id_2 }),
      ...(data.komentariy && { komentariy: data.komentariy }),
    }

    if (isEditMode) {
      return { ...baseData, guid: category.guid }
    }

    return {
      ...baseData,
      static: false,
      attributes: null,
      legal_entity_id: authStore?.userData?.legal_entity_id,
    }
  }

  const onSubmit = async (data) => {
    try {
      const submitData = buildSubmitData(data)

      if (isEditMode) {
        await updateMutation.mutateAsync(submitData)
      } else {
        await createAccount({
          method: "create_chart_of_account",
          data: submitData,
        })
      }

      queryClient.invalidateQueries({ queryKey: ["chartOfAccountsPlanFact"] })
      queryClient.invalidateQueries({ queryKey: ["chartOfAccountsV2"] })
      queryClient.invalidateQueries({ queryKey: ["get_chart_of_accounts"] })

      onClose()
    } catch (error) {
      console.error("Error saving chart of accounts:", error)
    }
  }

  return (
    <CustomDialog open={isOpen} onClose={onClose} contentClass="w-[640px]">
      <form
        id="chart-of-accounts-form"
        className="flex min-h-0 flex-col"
        onSubmit={handleSubmit(onSubmit)}
      >
        <DialogHeader
          title={isEditMode ? t("editTitle") : t("createTitle")}
          onClose={onClose}
        />

        <DialogBody className="flex flex-col gap-4">
          {/* Раздел учёта — значки и цвета те же, что в списке статей */}
          <CategoryTypeTabs
            full
            className="mb-2"
            value={activeTab}
            onChange={setActiveTab}
            label={(key) => t(`tabs.${key}`)}
            ariaLabel={t("createTitle")}
          />

          {/* Name */}
          <FormRow label={t("fields.name")} required error={errors.nazvanie?.message}>
            <Controller
              name="nazvanie"
              control={control}
              rules={{ required: t("errors.nameRequired") }}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  placeholder={t("placeholders.name")}
                  hasError={!!errors.nazvanie}
                />
              )}
            />
          </FormRow>

          {/* Parent category */}
          <FormRow label={t("fields.parent")}>
            <Controller
              name="chart_of_accounts_id_2"
              control={control}
              render={({ field }) => (
                <SelectStatiya
                  selectedValue={field.value}
                  setSelectedValue={field.onChange}
                  placeholder={t("placeholders.selectParent")}
                  shownParent={TAB_TO_API_TIP[activeTab]}
                  hasError={!!errors.chart_of_accounts_id_2}
                  className="bg-white"
                />
              )}
            />
          </FormRow>

          {/* Comment */}
          <FormRow label={t("fields.comment")} align="start">
            <Controller
              name="komentariy"
              control={control}
              render={({ field }) => (
                <TextArea
                  {...field}
                  placeholder={t("placeholders.comment")}
                  rows={4}
                />
              )}
            />
          </FormRow>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="secondary-btn h-9"
          >
            {tc("cancel")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="primary-btn"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditMode ? (
              tc("save")
            ) : (
              tc("create")
            )}
          </button>
        </DialogFooter>
      </form>
    </CustomDialog>
  )
}
