const fs = require('fs');
const path = require('path');

// Mapping of old errors to new error classes and their constructors
const errorMappings = [
  {
    old: "throw new Error('UNAUTHORIZED_COMPANY_ACCESS')",
    new: "throw new UnauthorizedCompanyAccessError('Shift', shift_id, admin_company_id)",
    context: 'shift'
  },
  {
    old: "throw new Error('INVALID_START_TIME_FORMAT')",
    new: "throw new InvalidStartTimeFormatError(data.start_time)",
  },
  {
    old: "throw new Error('INVALID_END_TIME_FORMAT')",
    new: "throw new InvalidEndTimeFormatError(data.end_time)",
  },
  {
    old: "throw new Error('OVERNIGHT_NOT_ALLOWED')",
    new: "throw new OvernightNotAllowedError(nextStart, nextEnd)",
  },
  {
    old: "throw new Error('SHIFT_OVERLAP')",
    new: "throw new ShiftOverlapError(target.company_employee_id, nextDate.toISOString().split('T')[0], s)",
  },
  {
    old: "throw new Error('UNAUTHORIZED_SHIFT_ACCESS')",
    new: "throw new UnauthorizedShiftAccessError(data.source_shift_ids[0], admin_company_id)",
  },
  {
    old: "throw new Error('UNAUTHORIZED_EMPLOYEE_ACCESS')",
    new: "throw new UnauthorizedEmployeeAccessError(data.employee_ids?.[0] || data.target_employee_ids?.[0] || query.employee_id, admin_company_id)",
  },
  {
    old: "throw new Error('DUPLICATION_CONFLICTS_DETECTED')",
    new: "throw new DuplicationConflictsDetectedError(conflicts)",
  },
  {
    old: "throw new Error('TEMPLATE_NOT_FOUND')",
    new: "throw new TemplateNotFoundError(data.template_id)",
  },
  {
    old: "throw new Error('INVALID_TIME_FORMAT')",
    new: "throw new InvalidTimeFormatError('time', startTime || endTime)",
  },
  {
    old: "throw new Error('BULK_CREATION_CONFLICTS_DETECTED')",
    new: "throw new BulkCreationConflictsDetectedError(conflicts)",
  },
];

// Service files to update
const serviceFiles = [
  path.join(__dirname, '../src/services/shift.service.ts'),
  path.join(__dirname, '../src/services/employee.service.ts'),
  path.join(__dirname, '../src/services/role.service.ts'),
  path.join(__dirname, '../src/services/shift-template.service.ts'),
];

console.log('🔄 Replacing error strings with custom error classes...\n');

serviceFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  let replacements = 0;

  errorMappings.forEach(mapping => {
    const regex = new RegExp(mapping.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);

    if (matches) {
      // For complex replacements, we need context-aware logic
      // For now, do simple string replacement
      content = content.replace(regex, mapping.new);
      replacements += matches.length;
    }
  });

  if (replacements > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${fileName}: ${replacements} replacements`);
  } else {
    console.log(`ℹ️  ${fileName}: No changes needed`);
  }
});

console.log('\n✨ Error replacement complete!');
