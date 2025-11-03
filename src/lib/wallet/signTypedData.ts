export type TypedDataLike = Record<string, unknown>;

export interface TypedDataCapableSigner {
  _signTypedData?: (domain: TypedDataLike, types: Record<string, any>, value: TypedDataLike) => Promise<string>;
  signTypedData?: (domain: TypedDataLike, types: Record<string, any>, value: TypedDataLike) => Promise<string>;
}

export function ensureTypedDataCompatibility<T extends TypedDataCapableSigner>(signer: T): T {
  const candidate = signer as TypedDataCapableSigner;
  if (
    candidate &&
    typeof candidate._signTypedData !== "function" &&
    typeof candidate.signTypedData === "function"
  ) {
    candidate._signTypedData = (domain, types, value) =>
      candidate.signTypedData!(domain, types, value);
  }
  return signer;
}
