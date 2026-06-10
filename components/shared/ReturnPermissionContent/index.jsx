import useMounted from "@/hooks/useMounted"

const ReturnPermissionContent = ({ canPermission, content }) => {
  const mounted = useMounted()

  if (!mounted) return null

  if (!canPermission) return ''

  return content
}

export default ReturnPermissionContent