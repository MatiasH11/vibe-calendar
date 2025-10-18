import { AppError } from './app-error';
import { HTTP_CODES } from '../constants/http_codes';

/**
 * Thrown when trying to create template with duplicate name
 */
export class DuplicateTemplateNameError extends AppError {
  readonly statusCode = HTTP_CODES.CONFLICT;
  readonly code = 'DUPLICATE_TEMPLATE_NAME';

  constructor(templateName: string, companyId: number) {
    super('A template with this name already exists in your company', {
      templateName,
      companyId,
    });
  }
}

/**
 * Thrown when template not found
 */
export class TemplateNotFoundError extends AppError {
  readonly statusCode = HTTP_CODES.NOT_FOUND;
  readonly code = 'TEMPLATE_NOT_FOUND';

  constructor(templateId: number) {
    super('Shift template not found or does not belong to your company', {
      templateId,
    });
  }
}
