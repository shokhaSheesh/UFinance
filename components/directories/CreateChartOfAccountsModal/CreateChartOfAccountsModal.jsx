"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import SelectStatiya from "@/components/ReadyComponents/SelectStatiya"
import CustomDialog from "@/components/shared/CustomDialog"
import Input from "@/components/shared/Input"
import TextArea from "@/components/shared/TextArea"
import { useUcodeRequestMutation, useUpdateChartOfAccounts } from "@/hooks/useDashboard"
import { cn } from "@/lib/utils"
import { authStore } from "@/store/auth.store"

const TAB_CONFIG = [
  { key: "income", color: "text-emerald-600 border-emerald-600" },
  { key: "expense", color: "text-rose-600 border-rose-600" },
  { key: "assets", color: "text-amber-600 border-amber-600" },
  { key: "liabilities", color: "text-orange-600 border-orange-600" },
  { key: "capital", color: "text-violet-600 border-violet-600" },
]

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
    <CustomDialog
      open={isOpen}
      onClose={onClose}
      contentClass="p-0"
    >
      <div className="w-[640px]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 shrink-0">
          <h2 className="text-2xl font-bold text-slate-900">
            {isEditMode ? t("editTitle") : t("createTitle")}
          </h2>
        </div>

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto">
          {/* Tabs */}
          <div className="flex mb-6 border-b border-gray-200">
            {TAB_CONFIG.map((tab, index) => {
              const isActive = activeTab === tab.key
              const isFirst = index === 0
              const isLast = index === TAB_CONFIG.length - 1

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "py-3 px-6 text-sm flex-1 font-medium bg-transparent border-b-2 transition-all duration-200 cursor-pointer",
                    isFirst && "pl-0",
                    isLast && "pr-0",
                    !isFirst && "ml-2",
                    isActive
                      ? cn(tab.color, "border-current")
                      : "text-gray-500 border-transparent hover:text-slate-900"
                  )}
                >
                  {t(`tabs.${tab.key}`)}
                </button>
              )
            })}
          </div>

          {/* Form */}
          <form
            id="chart-of-accounts-form"
            className="flex flex-col gap-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Name */}
            <div className="flex items-start gap-6">
              <label className="w-[180px] pt-3 text-[15px] text-slate-900 shrink-0">
                {t("fields.name")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 flex flex-col">
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
                      className={cn(
                        "flex-1 px-4 py-3 text-[15px] border rounded transition-all duration-200",
                        "placeholder:text-gray-400",
                        "focus:outline-none focus:border-[#0E73F6]",
                        errors.nazvanie
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300"
                      )}
                    />
                  )}
                />
                {errors.nazvanie && (
                  <div className="mt-2 text-[13px] text-red-500">
                    {errors.nazvanie.message}
                  </div>
                )}
              </div>
            </div>

            {/* Parent category */}
            <div className="flex items-start gap-6">
              <label className="w-[180px] pt-3 text-[15px] text-slate-900 shrink-0">
                {t("fields.parent")}
              </label>
              <div className="flex-1 flex flex-col">
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
              </div>
            </div>

            {/* Comment */}
            <div className="flex items-start gap-6">
              <label className="w-[180px] pt-3 text-[15px] text-slate-900 shrink-0">
                {t("fields.comment")}
              </label>
              <div className="flex-1 flex flex-col">
                <Controller
                  name="komentariy"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      {...field}
                      placeholder={t("placeholders.comment")}
                      rows={4}
                      className={''}
                    />
                  )}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={'secondary-btn'}
          >
            {tc("cancel")}
          </button>
          <button
            type="submit"
            form="chart-of-accounts-form"
            disabled={isSubmitting}
            className={'primary-btn'}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditMode ? (
              tc("save")
            ) : (
              tc("create")
            )}
          </button>
        </div>
      </div>
    </CustomDialog>
  )
}
