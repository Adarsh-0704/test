type SoftFixedArray<T, N extends number> = T[] & { length: N };
type SoftFixedArrayGrid<T, N extends number> = SoftFixedArray<T, N>[] & { length: N };

type StaticMethodsMatching<T, TargetSignature extends (...args: any[]) => any> = {
    [K in keyof T]: T[K] extends TargetSignature ? T[K] : never;
}[keyof T];

export type { SoftFixedArray, SoftFixedArrayGrid, StaticMethodsMatching };