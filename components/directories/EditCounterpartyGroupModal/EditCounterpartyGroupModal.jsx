"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import CustomDialog, {
  DialogBody,
  DialogFooter,
  DialogHeader,
  FormRow,
} from "@/components/shared/CustomDialog"
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
    <CustomDialog open={isOpen} onClose={handleClose} contentClass="w-[640px]">
      <form
        id="edit-group-form"
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-col"
      >
        <DialogHeader title={t("editGroupTitle")} onClose={handleClose} />

        <DialogBody className="flex flex-col gap-4">
          {/* Group Name */}
          <FormRow
            label={t("fields.groupName")}
            required
            error={errors.nazvanie_gruppy}
          >
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
          </FormRow>

          {/* Group Description */}
          <FormRow label={t("fields.groupDescription")} align="start">
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
          </FormRow>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={updateMutation.isPending}
            className="secondary-btn h-9"
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
        </DialogFooter>
      </form>
    </CustomDialog>
  )
}
