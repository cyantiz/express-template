export function convertEnumValueToArray<T>(data: Record<string, T>): T[] {
  return Object.values(data);
}
