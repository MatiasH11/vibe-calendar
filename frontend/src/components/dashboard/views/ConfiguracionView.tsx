'use client';

import { ViewContainer } from '../ViewContainer';
import { DashboardCard } from '../DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FadeIn } from '@/components/ui/transitions';
import { Settings, Save, Shield, Bell, Globe, User } from 'lucide-react';

export function ConfiguracionView() {
  return (
    <ViewContainer 
      title="Configuración" 
      subtitle="Personaliza el sistema según tus necesidades"
      headerActions={
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      }
    >
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración General */}
          <FadeIn delay={0.1}>
            <DashboardCard
              title="Configuración General"
              subtitle="Ajustes básicos del sistema"
              icon={Settings}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="empresa">Nombre de la Empresa</Label>
                  <Input id="empresa" placeholder="Mi Empresa S.A." />
                </div>
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Input id="timezone" value="UTC-3 (Argentina)" readOnly />
                </div>
                <div>
                  <Label htmlFor="moneda">Moneda</Label>
                  <Input id="moneda" value="ARS ($)" readOnly />
                </div>
              </div>
            </DashboardCard>
          </FadeIn>

          {/* Configuración de Usuario */}
          <FadeIn delay={0.2}>
            <DashboardCard
              title="Mi Perfil"
              subtitle="Información personal del usuario"
              icon={User}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" placeholder="usuario@empresa.com" />
                </div>
                <div>
                  <Label htmlFor="password">Cambiar Contraseña</Label>
                  <Input id="password" type="password" placeholder="Nueva contraseña" />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input id="confirm-password" type="password" placeholder="Confirmar nueva contraseña" />
                </div>
              </div>
            </DashboardCard>
          </FadeIn>

          {/* Notificaciones */}
          <FadeIn delay={0.3}>
            <DashboardCard
              title="Notificaciones"
              subtitle="Gestiona tus preferencias de notificaciones"
              icon={Bell}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificaciones por Email</p>
                    <p className="text-sm text-gray-600">Recibir alertas importantes</p>
                  </div>
                  <Button variant="outline" size="sm">Activado</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Recordatorios de Turnos</p>
                    <p className="text-sm text-gray-600">Notificar cambios en turnos</p>
                  </div>
                  <Button variant="outline" size="sm">Activado</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Reportes Automáticos</p>
                    <p className="text-sm text-gray-600">Envío semanal de reportes</p>
                  </div>
                  <Button variant="outline" size="sm">Desactivado</Button>
                </div>
              </div>
            </DashboardCard>
          </FadeIn>

          {/* Seguridad */}
          <FadeIn delay={0.4}>
            <DashboardCard
              title="Seguridad"
              subtitle="Configuración de seguridad y accesos"
              icon={Shield}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticación de Dos Factores</p>
                    <p className="text-sm text-gray-600">Protección adicional de la cuenta</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sesiones Activas</p>
                    <p className="text-sm text-gray-600">Gestionar dispositivos conectados</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Todas</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Registro de Actividad</p>
                    <p className="text-sm text-gray-600">Historial de acciones importantes</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Registro</Button>
                </div>
              </div>
            </DashboardCard>
          </FadeIn>
        </div>

        {/* Información del Sistema */}
        <FadeIn delay={0.5}>
          <DashboardCard
            title="Información del Sistema"
            subtitle="Detalles técnicos y soporte"
            icon={Globe}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Versión del Sistema</p>
                <p className="text-lg font-bold text-gray-900">v1.0.0</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Última Actualización</p>
                <p className="text-lg font-bold text-gray-900">15/08/2024</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Estado del Servidor</p>
                <p className="text-lg font-bold text-green-600">Operativo</p>
              </div>
            </div>
          </DashboardCard>
        </FadeIn>
      </div>
    </ViewContainer>
  );
}
