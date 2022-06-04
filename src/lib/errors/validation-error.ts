export class ValidationError extends Error {
  public details: any;
  constructor(details: any) {
    super('Validator Error');
    this.details = details;
  }
}
