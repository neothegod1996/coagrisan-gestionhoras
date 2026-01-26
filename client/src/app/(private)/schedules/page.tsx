"use client";

import { useState } from "react";
import { Schedule } from "@/types/schedule";
import SchedulesList from "@/components/schedules/schedules-list";
import ScheduleForm from "@/components/schedules/schedule-form";

export default function SchedulesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SchedulesList />

      {/* <ScheduleForm
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedSchedule(null);
        }}
        schedule={selectedSchedule}
        loading={loading}
      /> */}
    </div>
  );
}
