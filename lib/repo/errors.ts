export type RepoErrorCode =
  | "VALIDATION"
  | "SLOT_TAKEN"
  | "TOO_FAST"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CLOSED"
  | "RATE_LIMITED"
  | "NETWORK"
  | "STORAGE"
  | "NOT_IMPLEMENTED";

export class RepoError extends Error {
  readonly code: RepoErrorCode;
  /** Field name to message, for form errors. */
  readonly issues: Record<string, string>;

  constructor(code: RepoErrorCode, message: string, issues: Record<string, string> = {}) {
    super(message);
    this.name = "RepoError";
    this.code = code;
    this.issues = issues;
  }
}

export function isRepoError(e: unknown): e is RepoError {
  return e instanceof RepoError;
}

/** Friendly sentence for any error, for toasts and inline messages. */
export function errorMessage(e: unknown): string {
  if (isRepoError(e)) return e.message;
  return "Something went wrong. Please try again.";
}
