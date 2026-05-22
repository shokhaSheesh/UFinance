"use client"

import { useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import CustomDialog from "@/components/shared/CustomDialog"
import Input from "@/components/shared/Input"
import TextArea from "@/components/shared/TextArea"
import { useUpdateCounterpartiesGroup } from "@/hooks/useDashboard"
import { cn } from "@/lib/utils"

export default function EditCounterpartyGroupModal({ isOpen, onClose, group }) {
  const t = useTranslations("Directories.counterparty")
  const tc = useTranslations("Common")
  const queryClient = useQueryClient()
  const updateMutation = useUpdateCounterpartiesGroup()

  const [formData, setFormData] = useState({
    nazvanie_gruppy: "",
    opisanie_gruppy: "",
  })
  const [errors, setErrors] = useState({})

  // Initialize form when modal opens with group data
  useEffect(() => {
    if (!isOpen || !group) return

    // Defer state updates to avoid cascading renders
    Promise.resolve().then(() => {
      setFormData({
        nazvanie_gruppy: group.nazvanie_gruppy ?? group.nazvanie ?? "",
        opisanie_gruppy: group.opisanie_gruppy ?? "",
      })
      setErrors({})
    })
  }, [isOpen, group])

  const handleClose = () => {
    onClose()
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.nazvanie_gruppy.trim()) {
      newErrors.nazvanie_gruppy = t("errors.groupNameRequired")
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildSubmitData = () => ({
    guid: group.guid,
    nazvanie_gruppy: formData.nazvanie_gruppy.trim(),
    opisanie_gruppy: formData.opisanie_gruppy.trim() || "",
    data_sozdaniya: group.data_sozdaniya ?? new Date().toISOString(),
    data_obnovleniya: new Date().toISOString(),
    plan_fakt_admins_id: group.plan_fakt_admins_id ?? "",
    attributes: {},
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const submitData = buildSubmitData()
      await updateMutation.mutateAsync(submitData)

      queryClient.invalidateQueries({ queryKey: ["counterpartiesGroupsV2"] })
      queryClient.invalidateQueries({ queryKey: ["counterpartiesV2"] })

      handleClose()
    } catch (error) {
      console.error("Error updating group:", error)
    }
  }

  return (
    <CustomDialog open={isOpen} onClose={handleClose} contentClass="p-0">
      <div className="w-[640px]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 shrink-0">
          <h2 className="text-2xl font-bold text-slate-900">
            {t("editGroupTitle")}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 transition-colors duration-200 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6">
          <div className="flex flex-col gap-6">
            {/* Group Name */}
            <div className="flex items-start gap-6">
              <label className="w-[180px] pt-3 text-[15px] text-slate-900 shrink-0">
                {t("fields.groupName")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 flex flex-col">
                <Input
                  type="text"
                  value={formData.nazvanie_gruppy}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nazvanie_gruppy: e.target.value,
                    }))
                  }
                  placeholder={t("placeholders.groupName")}
                  className={cn(
                    "w-full px-4 py-3 text-[15px] border rounded transition-all duration-200",
                    "placeholder:text-gray-400",
                    "focus:outline-none focus:border-[#0E73F6]",
                    errors.nazvanie_gruppy
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300"
                  )}
                />
                {errors.nazvanie_gruppy && (
                  <div className="mt-2 text-[13px] text-red-500">
                    {errors.nazvanie_gruppy}
                  </div>
                )}
              </div>
            </div>

            {/* Group Description */}
            <div className="flex items-start gap-6">
              <label className="w-[180px] pt-3 text-[15px] text-slate-900 shrink-0">
                {t("fields.groupDescription")}
              </label>
              <div className="flex-1 flex flex-col">
                <TextArea
                  value={formData.opisanie_gruppy}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      opisanie_gruppy: e.target.value,
                    }))
                  }
                  placeholder={t("placeholders.groupDescription")}
                  rows={4}
                  hasError={!!errors.opisanie_gruppy}
                  className=""
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={updateMutation.isPending}
            className="secondary-btn"
          >
            {tc("cancel")}
          </button>
          <button
            type="submit"
            form="edit-group-form"
            disabled={updateMutation.isPending}
            className="primary-btn"
          >
            {updateMutation.isPending ? tc("saving") : tc("save")}
          </button>
        </div>
      </div>
    </CustomDialog>
  )
}
