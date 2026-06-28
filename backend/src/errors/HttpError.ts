export class HttpError extends Error {
  statusCode: number;
  code: string;
  details: string[];
  isOperational: boolean;

  constructor(statusCode: number, code: string, message: string, details: string[] = []) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}
