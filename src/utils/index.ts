

export function isOfType<T>(obj: any, props: (keyof T)[]): obj is T {
    return props.every(prop => prop in obj);
  }