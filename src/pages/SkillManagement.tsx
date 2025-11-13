import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { skillsApi } from "../services/api/skillsApi";
import { QUERY_KEYS } from "../lib/constants";
import SkillList from "../components/skills/SkillList";
import SkillForm from "../components/skills/SkillForm";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import { Modal } from "../components/ui/ReusableModal";
import Button from "../components/ui/button/Button";
import { Skill } from "../types/skill";
import { PlusIcon } from "../icons";

export default function SkillManagementPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const { data: skillsData } = useQuery({
    queryKey: [QUERY_KEYS.skills.all],
    queryFn: () => skillsApi.getSkills(),
  });

  const handleCreateClick = () => {
    setEditingSkill(null);
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (skill: Skill) => {
    setEditingSkill(skill);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingSkill(null);
  };

  return (
    <>
      <PageMeta
        title="Skill Management | ADAA Employment LLC"
        description="Manage skills and their types for ADAA Employment LLC"
      />
      <PermissionGuard
        permission="skill:read"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access skill management.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="Skill Management" />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <SkillList
            onCreateSkill={handleCreateClick}
            onEditSkill={handleEditClick}
            totalSkills={skillsData?.total || 0}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={handleCloseModal}
          title={editingSkill ? "Edit Skill" : "Create New Skill"}
          size="lg"
        >
          <div className="p-6">
            <SkillForm
              skill={editingSkill || undefined}
              onClose={handleCloseModal}
            />
          </div>
        </Modal>
      </PermissionGuard>
    </>
  );
}
