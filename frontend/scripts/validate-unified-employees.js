#!/usr/bin/env node

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}🔍 VALIDACIÓN UX: EMPLEADOS UNIFICADOS${colors.reset}`);
console.log('==========================================\n');

const fs = require('fs');
const path = require('path');

// Archivos críticos del diseño unificado
const requiredFiles = [
  // Stores y hooks
  'src/stores/employeesStore.ts',
  'src/hooks/useCargosContextual.ts',
  'src/hooks/useContextualStats.ts',
  
  // Validaciones
  'src/lib/validations/cargo.ts',
  
  // Componentes principales
  'src/components/dashboard/views/EmpleadosView.tsx',
  'src/components/dashboard/views/employees/EmployeeMainPanel.tsx',
  'src/components/dashboard/views/employees/RolesContextualSidebar.tsx',
  
  // Componentes UX
  'src/components/employees/EmployeeFormModal.tsx',
  'src/components/employees/RoleFormModal.tsx',
  'src/components/employees/CargoInlineCreateForm.tsx',
  'src/components/employees/EmployeeContextualActions.tsx',
  'src/components/dashboard/views/employees/EmployeeBreadcrumbs.tsx',
  
  // Estadísticas contextuales
  'src/components/employees/ContextualStatsCards.tsx',
  'src/components/employees/ContextualDistribution.tsx',
  'src/components/employees/ContextualInsights.tsx',
  
  // Componentes UI necesarios
  'src/components/ui/scroll-area.tsx',
  'src/components/ui/dropdown-menu.tsx',
  'src/components/ui/progress.tsx',
];

console.log(`${colors.blue}📁 Verificando estructura de archivos...${colors.reset}`);

let allFilesExist = true;
let coreComponentsExist = true;
let uxComponentsExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`${colors.green}✅${colors.reset} ${file}`);
  } else {
    console.log(`${colors.red}❌${colors.reset} ${file} - FALTANTE`);
    allFilesExist = false;
    
    if (file.includes('EmployeeMainPanel') || file.includes('RolesContextualSidebar')) {
      coreComponentsExist = false;
    }
    if (file.includes('Contextual') || file.includes('EmployeeContextualActions')) {
      uxComponentsExist = false;
    }
  }
});

// Verificar que no existen archivos de tabs (diseño anterior)
const deprecatedFiles = [
  'src/components/dashboard/views/employees/PersonalTab.tsx',
  'src/components/dashboard/views/employees/CargosTab.tsx',
];

console.log(`\n${colors.yellow}📋 Verificando ausencia de diseño anterior (tabs)...${colors.reset}`);
let hasDeprecatedFiles = false;

deprecatedFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`${colors.yellow}⚠️${colors.reset} ${file} - DEBERÍA ELIMINARSE (diseño anterior)`);
    hasDeprecatedFiles = true;
  } else {
    console.log(`${colors.green}✅${colors.reset} ${file} - Correctamente eliminado`);
  }
});

// Reporte final
console.log(`\n${colors.purple}📊 REPORTE DE VALIDACIÓN${colors.reset}`);
console.log('=======================');

if (allFilesExist && !hasDeprecatedFiles) {
  console.log(`${colors.green}🎉 ¡ESTRUCTURA PERFECTA!${colors.reset}`);
  console.log(`${colors.green}✅ Todos los archivos del diseño unificado presentes${colors.reset}`);
  console.log(`${colors.green}✅ Archivos del diseño anterior eliminados${colors.reset}`);
  console.log(`\n${colors.blue}📋 Siguiente: Ejecutar validación manual de UX${colors.reset}`);
} else {
  if (!coreComponentsExist) {
    console.log(`${colors.red}❌ CRÍTICO: Componentes principales faltantes${colors.reset}`);
  }
  if (!uxComponentsExist) {
    console.log(`${colors.red}❌ CRÍTICO: Componentes UX faltantes${colors.reset}`);
  }
  if (hasDeprecatedFiles) {
    console.log(`${colors.yellow}⚠️  LIMPIEZA: Eliminar archivos del diseño anterior${colors.reset}`);
  }
  console.log(`\n${colors.red}🛠️  Solución: Completar implementación antes de continuar${colors.reset}`);
  process.exit(1);
}
