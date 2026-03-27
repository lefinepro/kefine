/**
 * Transformation type definitions — generic interfaces for converting
 * between different data formats (OKR ↔ Org ↔ remote exchange payloads)
 * OKR-013.2 Task 1.2.5
 */

/** Validation error detail */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/** Result of a transformation validation */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** Error thrown during transformation */
export class TransformationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly validationErrors?: ValidationError[]
  ) {
    super(message);
    this.name = 'TransformationError';
  }
}

/**
 * Generic one-way transformer from T to U
 */
export interface Transformer<T, U> {
  transform(input: T): U;
}

/**
 * Generic async one-way transformer from T to U
 */
export interface AsyncTransformer<T, U> {
  transform(input: T): Promise<U>;
}

/**
 * Bidirectional transformer between T and U
 */
export interface BidirectionalTransformer<T, U> {
  to(source: T): U;
  from(target: U): T;
}

/**
 * Async bidirectional transformer between T and U
 */
export interface AsyncBidirectionalTransformer<T, U> {
  to(source: T): Promise<U>;
  from(target: U): Promise<T>;
}

/**
 * Transformer that validates input before transforming
 */
export interface ValidatingTransformer<T, U> extends Transformer<T, U> {
  validate(input: T): ValidationResult;
}

/**
 * Result of a transform operation that may fail
 */
export type TransformResult<T> =
  | { success: true; data: T }
  | { success: false; error: TransformationError };

/**
 * Create a successful transform result
 */
export function ok<T>(data: T): TransformResult<T> {
  return { success: true, data };
}

/**
 * Create a failed transform result
 */
export function err<T>(error: TransformationError): TransformResult<T> {
  return { success: false, error };
}
