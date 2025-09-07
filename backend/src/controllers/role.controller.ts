import { Request, Response, NextFunction } from 'express';
import { CreateRoleBody, RoleFiltersQuery, UpdateRoleBody } from '../validations/role.validation';
import { role_service } from '../services/role.service';
import { HTTP_CODES } from '../constants/http_codes';

// Handler existente mantenido
export const createRoleHandler = async (
  req: Request<{}, {}, CreateRoleBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const role = await role_service.create(req.body, company_id);
    return res.status(HTTP_CODES.CREATED).json({ success: true, data: role });
  } catch (error: any) {
    if (error?.message === 'DUPLICATE_ROLE') {
      return res.status(HTTP_CODES.CONFLICT).json({ 
        success: false, 
        error: { error_code: 'DUPLICATE_ROLE', message: 'Role name already exists for this company' } 
      });
    }
    next(error);
  }
};

// NUEVO: Handler con filtros y opciones avanzadas
export const getRolesWithFiltersHandler = async (
  req: Request<{}, {}, {}, RoleFiltersQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const result = await role_service.findByCompanyWithFilters(company_id, req.query);
    return res.status(HTTP_CODES.OK).json({ 
      success: true, 
      data: result.roles,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Handler existente mantenido para compatibilidad
export const getRolesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const roles = await role_service.find_by_company(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

// NUEVO: Obtener rol por ID
export const getRoleByIdHandler = async (
  req: Request<{ id: string }, {}, {}, { include?: 'employees' }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = parseInt(req.params.id);
    const includeEmployees = req.query.include === 'employees';
    
    if (isNaN(id)) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_ID', message: 'Invalid role ID' }
      });
    }

    const role = await role_service.findById(id, company_id, includeEmployees);
    return res.status(HTTP_CODES.OK).json({ success: true, data: role });
  } catch (error: any) {
    if (error?.message === 'ROLE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'ROLE_NOT_FOUND', message: 'Role not found' }
      });
    }
    next(error);
  }
};

// NUEVO: Actualizar rol
export const updateRoleHandler = async (
  req: Request<{ id: string }, {}, UpdateRoleBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_ID', message: 'Invalid role ID' }
      });
    }

    const role = await role_service.update(id, req.body, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: role });
  } catch (error: any) {
    if (error?.message === 'ROLE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'ROLE_NOT_FOUND', message: 'Role not found' }
      });
    }
    if (error?.message === 'DUPLICATE_ROLE') {
      return res.status(HTTP_CODES.CONFLICT).json({
        success: false,
        error: { error_code: 'DUPLICATE_ROLE', message: 'Role name already exists for this company' }
      });
    }
    next(error);
  }
};

// NUEVO: Eliminar rol
export const deleteRoleHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_ID', message: 'Invalid role ID' }
      });
    }

    await role_service.delete(id, company_id);
    return res.status(HTTP_CODES.OK).json({ 
      success: true, 
      message: 'Role deleted successfully' 
    });
  } catch (error: any) {
    if (error?.message === 'ROLE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'ROLE_NOT_FOUND', message: 'Role not found' }
      });
    }
    if (error?.message === 'ROLE_HAS_EMPLOYEES') {
      return res.status(HTTP_CODES.CONFLICT).json({
        success: false,
        error: { error_code: 'ROLE_HAS_EMPLOYEES', message: 'Cannot delete role with assigned employees' }
      });
    }
    next(error);
  }
};


