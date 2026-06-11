'use client'

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/ucode/base'
import { queryClient } from '@/lib/queryClient'
import {
  showErrorNotification,
  showSuccessNotification,
} from '@/lib/utils/notifications'
import { authStore } from '@/store/auth.store'

export const useContractsQuery = (branchId) => {
  return useQuery({
    queryKey: ['get_contract', branchId],
    queryFn: () =>
      apiClient?.defaultUcodeFunction({
        urlMethod: 'GET',
        urlParams: `/items/templates?from-ofs=true`,
      }),
    placeholderData: keepPreviousData,
    refetchOnMount: true,
    select: (data) => data?.data?.data?.response,
  })
}

export const mapContracts = (data) =>
  data?.map((item) => ({
    branch_id: item?.branch_id || '',
    file: item?.file || '',
    company_id: item?.company_id || '',
    guid: item?.guid,
    name: item?.name,
    branch_name: item?.branch_id_data?.name,
  })) || []

export const useUpdateContract = ({ contractGuid, branchId, onSuccess, tco }) => {
  return useMutation({
    mutationKey: ['update_contract', contractGuid],
    mutationFn: (payload) =>
      apiClient?.defaultUcodeFunction({
        urlMethod: 'PUT',
        urlParams: `/items/templates?from-ofs=true`,
        data: payload,
      }),
    onSuccess: () => {
      showSuccessNotification(tco?.('editDialog.save'))
      queryClient?.invalidateQueries({ queryKey: ['get_contract', branchId] })
      onSuccess?.()
    },
    onError: () => {
      showErrorNotification(tco?.('editDialog.saveError'))
    },
  })
}

export const uploadContractHtml = async ({ html, fileName }) => {
  const formData = new FormData()
  const htmlBlob = new Blob([html], { type: 'text/html' })
  formData?.append('file', htmlBlob, `${fileName || 'contract'}.html`)

  const uploadResponse = await fetch(
    'https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${authStore?.authToken}` },
      body: formData,
    },
  )
  const uploadData = await uploadResponse?.json()
  const fileLink = uploadData?.data?.link
  return fileLink ? `https://cdn.u-code.io/${fileLink}` : ''
}
