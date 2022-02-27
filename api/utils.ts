export function getInt(
  str?: string | undefined | null,
  def: number = 0
): number {
  const v = parseInt(str)
  if (isNaN(v)) return def
  return v
}
