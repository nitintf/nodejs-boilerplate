export class CustomError extends Error {
  public errorCode: number;

  constructor(message: string, errorCode: number) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
    this.errorCode = errorCode;
  }
}
