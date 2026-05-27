"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CreateAssignmentForm } from "@/components/assignments/CreateAssignmentForm";

export default function CreateAssignmentPage() {
  return (
    <DashboardLayout headerTitle="Assignment" backHref="/assignments">
      <CreateAssignmentForm />
    </DashboardLayout>
  );
}
