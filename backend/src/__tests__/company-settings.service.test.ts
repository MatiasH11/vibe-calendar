/**
 * Company Settings Service Tests
 * Reference: PLAN.md Section 5 (Company Configuration System)
 *
 * Tests for company-specific configuration and business rules
 */

import { company_settings_service } from '../services/company-settings.service';
import { prisma } from '../config/prisma_client';
import { cacheService } from '../services/cache.service';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies
jest.mock('../config/prisma_client', () => ({
  prisma: {
    company: {
      findUnique: jest.fn(),
    },
    company_settings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock('../services/cache.service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Company Settings Service (PLAN.md 5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    const mockCompanyId = 1;
    const mockSettings = {
      id: 1,
      company_id: mockCompanyId,
      max_daily_hours: new Decimal(12.0),
      max_weekly_hours: new Decimal(40.0),
      min_break_hours: new Decimal(11.0),
      allow_overnight_shifts: false,
      timezone: 'UTC',
      created_at: new Date('2025-01-01T00:00:00Z'),
      updated_at: new Date('2025-01-01T00:00:00Z'),
    };

    it('should return cached settings if available', async () => {
      (cacheService.get as jest.Mock).mockReturnValue(mockSettings);

      const result = await company_settings_service.getSettings(mockCompanyId);

      expect(result).toEqual(mockSettings);
      expect(cacheService.get).toHaveBeenCalledWith('company_settings:1');
      expect(prisma.company_settings.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      (cacheService.get as jest.Mock).mockReturnValue(null);
      (prisma.company_settings.findUnique as jest.Mock).mockResolvedValue(mockSettings);

      const result = await company_settings_service.getSettings(mockCompanyId);

      expect(result).toEqual(mockSettings);
      expect(prisma.company_settings.findUnique).toHaveBeenCalledWith({
        where: { company_id: mockCompanyId },
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        'company_settings:1',
        mockSettings,
        5 * 60 * 1000
      );
    });

    it('should create default settings if none exist', async () => {
      (cacheService.get as jest.Mock).mockReturnValue(null);
      (prisma.company_settings.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.company_settings.create as jest.Mock).mockResolvedValue(mockSettings);

      const result = await company_settings_service.getSettings(mockCompanyId);

      expect(prisma.company_settings.create).toHaveBeenCalledWith({
        data: {
          company_id: mockCompanyId,
          max_daily_hours: 12.0,
          max_weekly_hours: 40.0,
          min_break_hours: 11.0,
          allow_overnight_shifts: false,
          timezone: 'UTC',
        },
      });
      expect(result).toEqual(mockSettings);
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    const mockCompanyId = 1;
    const mockCompany = { id: mockCompanyId, name: 'Test Company' };
    const updatedSettings = {
      id: 1,
      company_id: mockCompanyId,
      max_daily_hours: new Decimal(10.0),
      max_weekly_hours: new Decimal(48.0),
      min_break_hours: new Decimal(12.0),
      allow_overnight_shifts: true,
      timezone: 'America/New_York',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should update settings successfully', async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.company_settings.upsert as jest.Mock).mockResolvedValue(updatedSettings);

      const updateData = {
        max_daily_hours: 10.0,
        max_weekly_hours: 48.0,
        min_break_hours: 12.0,
        allow_overnight_shifts: true,
        timezone: 'America/New_York',
      };

      const result = await company_settings_service.updateSettings(mockCompanyId, updateData);

      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
      });
      expect(prisma.company_settings.upsert).toHaveBeenCalled();
      expect(cacheService.delete).toHaveBeenCalledWith('company_settings:1');
      expect(result).toEqual(updatedSettings);
    });

    it('should handle partial updates', async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.company_settings.upsert as jest.Mock).mockResolvedValue(updatedSettings);

      const updateData = {
        max_daily_hours: 10.0,
      };

      await company_settings_service.updateSettings(mockCompanyId, updateData);

      const upsertCall = (prisma.company_settings.upsert as jest.Mock).mock.calls[0][0];
      expect(upsertCall.update).toHaveProperty('max_daily_hours');
      expect(upsertCall.update).not.toHaveProperty('timezone');
    });

    it('should throw error if company not found', async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        company_settings_service.updateSettings(mockCompanyId, { max_daily_hours: 10 })
      ).rejects.toThrow('COMPANY_NOT_FOUND');

      expect(prisma.company_settings.upsert).not.toHaveBeenCalled();
    });

    it('should convert numbers to Decimal', async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (prisma.company_settings.upsert as jest.Mock).mockResolvedValue(updatedSettings);

      await company_settings_service.updateSettings(mockCompanyId, {
        max_daily_hours: 10.5,
        max_weekly_hours: 45.0,
      });

      const upsertCall = (prisma.company_settings.upsert as jest.Mock).mock.calls[0][0];
      expect(upsertCall.update.max_daily_hours).toBeInstanceOf(Decimal);
      expect(upsertCall.update.max_weekly_hours).toBeInstanceOf(Decimal);
    });
  });

  describe('getDefaultSettings', () => {
    it('should return default settings object', () => {
      const defaults = company_settings_service.getDefaultSettings();

      expect(defaults).toEqual({
        max_daily_hours: 12.0,
        max_weekly_hours: 40.0,
        min_break_hours: 11.0,
        allow_overnight_shifts: false,
        timezone: 'UTC',
      });
    });

    it('should return a new object each time (not mutable reference)', () => {
      const defaults1 = company_settings_service.getDefaultSettings();
      const defaults2 = company_settings_service.getDefaultSettings();

      expect(defaults1).toEqual(defaults2);
      expect(defaults1).not.toBe(defaults2); // Different object instances
    });
  });

  describe('validateShiftAgainstSettings', () => {
    const mockCompanyId = 1;
    const mockSettings = {
      id: 1,
      company_id: mockCompanyId,
      max_daily_hours: new Decimal(12.0),
      max_weekly_hours: new Decimal(40.0),
      min_break_hours: new Decimal(11.0),
      allow_overnight_shifts: false,
      timezone: 'UTC',
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(() => {
      (cacheService.get as jest.Mock).mockReturnValue(null);
      (prisma.company_settings.findUnique as jest.Mock).mockResolvedValue(mockSettings);
    });

    it('should validate shift within limits', async () => {
      const result = await company_settings_service.validateShiftAgainstSettings(
        mockCompanyId,
        8.0, // 8 hour shift
        false // not overnight
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject shift exceeding max daily hours', async () => {
      const result = await company_settings_service.validateShiftAgainstSettings(
        mockCompanyId,
        13.0, // 13 hour shift (exceeds 12h max)
        false
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds company maximum of 12h');
    });

    it('should reject overnight shifts when not allowed', async () => {
      const result = await company_settings_service.validateShiftAgainstSettings(
        mockCompanyId,
        8.0,
        true // overnight shift
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Overnight shifts are not allowed for this company');
    });

    it('should allow overnight shifts when configured', async () => {
      const settingsWithOvernight = {
        ...mockSettings,
        allow_overnight_shifts: true,
      };
      (prisma.company_settings.findUnique as jest.Mock).mockResolvedValue(settingsWithOvernight);

      const result = await company_settings_service.validateShiftAgainstSettings(
        mockCompanyId,
        8.0,
        true
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('validateWeeklyHours', () => {
    const mockCompanyId = 1;
    const mockSettings = {
      id: 1,
      company_id: mockCompanyId,
      max_daily_hours: new Decimal(12.0),
      max_weekly_hours: new Decimal(40.0),
      min_break_hours: new Decimal(11.0),
      allow_overnight_shifts: false,
      timezone: 'UTC',
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(() => {
      (cacheService.get as jest.Mock).mockReturnValue(null);
      (prisma.company_settings.findUnique as jest.Mock).mockResolvedValue(mockSettings);
    });

    it('should validate weekly hours within limit', async () => {
      const result = await company_settings_service.validateWeeklyHours(mockCompanyId, 38.0);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject weekly hours exceeding limit', async () => {
      const result = await company_settings_service.validateWeeklyHours(mockCompanyId, 45.0);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds company maximum of 40h');
    });

    it('should accept exactly max weekly hours', async () => {
      const result = await company_settings_service.validateWeeklyHours(mockCompanyId, 40.0);

      expect(result.valid).toBe(true);
    });
  });

  describe('getMinBreakHours', () => {
    const mockCompanyId = 1;
    const mockSettings = {
      id: 1,
      company_id: mockCompanyId,
      max_daily_hours: new Decimal(12.0),
      max_weekly_hours: new Decimal(40.0),
      min_break_hours: new Decimal(11.0),
      allow_overnight_shifts: false,
      timezone: 'UTC',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should return minimum break hours as number', async () => {
      (cacheService.get as jest.Mock).mockReturnValue(null);
      (prisma.company_settings.findUnique as jest.Mock).mockResolvedValue(mockSettings);

      const result = await company_settings_service.getMinBreakHours(mockCompanyId);

      expect(result).toBe(11.0);
      expect(typeof result).toBe('number');
    });
  });

  describe('Cache management', () => {
    it('should generate correct cache key', () => {
      const key = company_settings_service.getCacheKey(123);
      expect(key).toBe('company_settings:123');
    });

    it('should invalidate cache for company', () => {
      company_settings_service.invalidateCache(123);
      expect(cacheService.delete).toHaveBeenCalledWith('company_settings:123');
    });

    it('should invalidate bulk cache for multiple companies', () => {
      company_settings_service.invalidateBulkCache([1, 2, 3]);

      expect(cacheService.delete).toHaveBeenCalledTimes(3);
      expect(cacheService.delete).toHaveBeenCalledWith('company_settings:1');
      expect(cacheService.delete).toHaveBeenCalledWith('company_settings:2');
      expect(cacheService.delete).toHaveBeenCalledWith('company_settings:3');
    });
  });
});
