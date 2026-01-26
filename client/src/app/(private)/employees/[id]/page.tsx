"use client";

import { useEffect, useState } from "react";
import { FullEmployee } from "@/types/employee";
import EmployeeForm from "@/components/employees/employee-form";
import EmployeeDetail from "@/components/employees/employee-detail";
import { RequestHandler } from "@/types";
import { getEmployee } from "@/services/employee";
import { useParams } from "next/navigation";
import RingLoading from "@/components/loading/Ring";

export default function EmployeePage() {
  const { id } = useParams();

  const [employee, setEmployee] = useState<RequestHandler<FullEmployee | null>>({ data: null, loading: true });
  const [showForm, setShowForm] = useState(false);

  const handleGetEmployee = async () => {
    setEmployee({ ...employee, loading: true });
    getEmployee(id as string).then((response) => {
      if (!response) return;
      setEmployee({ ...employee, loading: false, data: response.data });
    });
  }

  useEffect(() => {
    handleGetEmployee();
  }, [id]);

  return (
    <div className="container mx-auto px-4 py-8">
      {employee.loading ? (
        <div className="absolute left-0 top-0 flex items-center justify-center w-screen h-screen">
          <RingLoading />
        </div>
      ) : (
        <EmployeeDetail
          employee={employee.data}
          loading={employee.loading}
          onEdit={() => setShowForm(true)}
        />
      )}

      <EmployeeForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
        }}
        refetch={handleGetEmployee}
        employee_id={employee.data?.id}
      />
    </div>
  );
}
