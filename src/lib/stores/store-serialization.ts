export function serializeWithDates<T>(state: T): string {
  return JSON.stringify(state, (_key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }

    return value;
  });
}

export function deserializeWithDates<T>(data: string): T {
  return JSON.parse(data, (_key, value) => {
    if (value?.__type === 'Date') {
      return new Date(value.value);
    }

    return value;
  }) as T;
}
