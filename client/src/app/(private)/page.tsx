'use client';

import Link from "next/link";
import {
  Users,
  Clock,
  Timer,
  CalendarDays,
  Monitor,
  BarChart3,
  MapPin,
  UserPlus
} from "lucide-react";
import { AuthRoleEnum } from "@/types/auth";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";

const VISIBLE_MODULES = {
  [AuthRoleEnum.Admin]: [
    EmployeeManagement,
    Reports,
    Terminals
  ],
  [AuthRoleEnum.Manager]: [
    EmployeeManagement,
    ManagerEmployee,
    Reports
  ],
  [AuthRoleEnum.Employee]: [
    Employee
  ]
}

export default function Home() {
  const role = useAuthStore(state => state.user?.role);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header Corporativo */}
        <div className="bg-gradient-brand rounded-2xl p-8 text-white mb-8">
          <div className="text-center">
            {/* <div className="w-16 h-16 bg-brand-primary rounded-md flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div> */}
            <div className={'flex items-center justify-center mb-5'}>
              <Image src="/logo-transparent.png" alt="Coagrisan" width={200} height={200} />
            </div>
            <h1 className="text-3xl font-semibold mb-2">
              Sistema de Fichajes Coagrisan
            </h1>
            <p className="text-slate-200 text-lg">
              Plataforma integral para la gestión de recursos humanos y control horario
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {VISIBLE_MODULES[role as AuthRoleEnum].map((Module, index) => (
            <Module key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmployeeManagement() {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Gestión de Personal</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/employees"
          className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Empleados</h3>
              <p className="text-xs text-slate-600">Listado de empleados</p>
            </div>
          </div>
        </Link>

        <Link href="/locations" className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Ubicaciones</h3>
              <p className="text-xs text-slate-600">Ubicaciones de los centros</p>
            </div>
          </div>
        </Link>

        <Link href="/schedules" className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <Timer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Horarios</h3>
              <p className="text-xs text-slate-600">Gestión de horarios</p>
            </div>
          </div>
        </Link>

        <Link href="/profiles" className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Perfiles</h3>
              <p className="text-xs text-slate-600">Gestión de perfiles</p>
            </div>
          </div>
        </Link>

        {/* <Link href="/calendar" className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Incidencias</h3>
              <p className="text-xs text-slate-600">Gestión de incidencias</p>
            </div>
          </div>
        </Link> */}

        <Link href="/employees/turnover" className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Altas y bajas</h3>
              <p className="text-xs text-slate-600">Gestión de altas y bajas</p>
            </div>
          </div>
        </Link>

        <Link href="/time-sheet" className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Registro de horas</h3>
              <p className="text-xs text-slate-600">Gestión de registro de horas</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

function Reports() {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Reportes</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/reports/time-tracking" className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Listado fichajes</h3>
              <p className="text-xs text-slate-600">Semanales y mensuales</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

function Terminals() {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
          <Monitor className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Terminales y Conexiones</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/terminals" className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Terminales</h3>
              <p className="text-xs text-slate-600">Gestión de terminales</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

function Employee() {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Empleado</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/employees/tracker"
          className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Tracker de horas</h3>
              <p className="text-xs text-slate-600">Tracker de horas trabajadas</p>
            </div>
          </div>
        </Link>
        <Link
          href="/employees/time-sheet"
          className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Registro de horas</h3>
              <p className="text-xs text-slate-600">Gestión de registro de horas</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

function ManagerEmployee() {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Empleado</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/employees/tracker"
          className="bg-brand-primary-50 hover:bg-brand-primary-400 rounded-md p-4 transition-colors group border border-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center group-hover:bg-brand-primary-600 transition-colors">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Tracker de horas</h3>
              <p className="text-xs text-slate-600">Tracker de horas trabajadas</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}