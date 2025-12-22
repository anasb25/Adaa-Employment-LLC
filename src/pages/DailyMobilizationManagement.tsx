import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { mobilizationsApi } from '../services/api/mobilizationsApi';
import { Mobilization } from '../types/mobilization';
import { MOB_STATUS_COLORS, JOB_STATUS_COLORS } from '../lib/mobilizationConstants';
import Button from '../components/ui/button/Button';
import { Accordion, AccordionItem } from '../components/ui/accordion/Accordion';
import DailyMobilizationImportModal from '../components/mobilizations/DailyMobilizationImportModal';
import { PlusIcon, FileIcon, CalenderIcon, DownloadIcon, BuildingIcon, GroupIcon } from '../icons';
import { downloadFile } from '../utils/excelValidator';

interface ProjectGroup {
  projectId: number | null;
  projectName: string;
  clientName: string;
  mobilizations: Mobilization[];
}

export default function DailyMobilizationManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Fetch mobilizations for the selected date
  const { data: mobilizations, isLoading } = useQuery({
    queryKey: ['daily-mobilizations', selectedDate],
    queryFn: () =>
      mobilizationsApi.getAll({
        actionDate: selectedDate,
        page: 1,
        limit: 1000, // Get all for the day
      }),
  });

  // Export mobilizations for the day
  const exportMutation = useMutation({
    mutationFn: () => mobilizationsApi.exportMobilizations(),
    onSuccess: (blob) => {
      downloadFile(blob, `mobilizations_${selectedDate}.xlsx`);
      toast.success("Mobilizations exported successfully!");
    },
    onError: () => {
      toast.error("Failed to export mobilizations");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => mobilizationsApi.delete(id),
    onSuccess: () => {
      toast.success('Mobilization deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['daily-mobilizations', selectedDate] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete mobilization');
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this mobilization record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateManual = () => {
    // Navigate to create page with the selected date pre-filled
    navigate(`/mobilizations/create?date=${selectedDate}`);
  };

  // Group mobilizations by project
  const groupedMobilizations: ProjectGroup[] = (() => {
    if (!mobilizations?.data) return [];

    const groups = new Map<number | null, ProjectGroup>();

    mobilizations.data.forEach((mob: Mobilization) => {
      const key = mob.projectId;
      if (!groups.has(key)) {
        groups.set(key, {
          projectId: key,
          projectName: mob.project?.name || 'No Project Assigned',
          clientName: mob.project?.client?.name || 'N/A',
          mobilizations: [],
        });
      }
      groups.get(key)!.mobilizations.push(mob);
    });

    return Array.from(groups.values()).sort((a, b) => {
      // Put "No Project" last
      if (a.projectId === null) return 1;
      if (b.projectId === null) return -1;
      return a.projectName.localeCompare(b.projectName);
    });
  })();

  const getMobStatusBadge = (status: string) => {
    const colorClass = MOB_STATUS_COLORS[status as keyof typeof MOB_STATUS_COLORS] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getJobStatusBadge = (status: string) => {
    const colorClass = JOB_STATUS_COLORS[status as keyof typeof JOB_STATUS_COLORS] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalMobilizations = mobilizations?.data?.length || 0;
  const mobilizedCount = mobilizations?.data?.filter((m: Mobilization) => m.mobStatus === 'mobilized').length || 0;
  const demobilizedCount = totalMobilizations - mobilizedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Mobilization Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage daily attendance and mobilization records by date
          </p>
        </div>
      </div>

      {/* Date Selector Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <CalenderIcon className="h-5 w-5" />
                <span>Select Date</span>
              </div>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-64 appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formattedDate}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => exportMutation.mutate()}
              variant="outline"
              startIcon={<DownloadIcon className="h-5 w-5" />}
              disabled={exportMutation.isPending || totalMobilizations === 0}
            >
              Export
            </Button>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              startIcon={<FileIcon className="h-5 w-5" />}
            >
              Import Excel
            </Button>
            <Button
              onClick={handleCreateManual}
              startIcon={<PlusIcon />}
            >
              Create Manual
            </Button>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <DailyMobilizationImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        selectedDate={selectedDate}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Records</dt>
                <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{totalMobilizations}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Mobilized</dt>
                <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{mobilizedCount}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Demobilized</dt>
                <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{demobilizedCount}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Mobilizations by Project */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mobilizations by Project
          </h2>
          {groupedMobilizations.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {groupedMobilizations.length} project(s)
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              Loading mobilizations...
            </div>
          </div>
        ) : groupedMobilizations.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-12">
            <div className="text-center">
              <BuildingIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No mobilizations found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a mobilization or importing from Excel.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  variant="outline"
                  startIcon={<FileIcon className="h-5 w-5" />}
                >
                  Import Excel
                </Button>
                <Button
                  onClick={handleCreateManual}
                  startIcon={<PlusIcon />}
                >
                  Create Manual
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Accordion>
            {groupedMobilizations.map((group) => (
              <AccordionItem
                key={group.projectId || 'no-project'}
                title={
                  <div>
                    <div className="font-semibold">{group.projectName}</div>
                    {group.clientName !== 'N/A' && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                        Client: {group.clientName}
                      </div>
                    )}
                  </div>
                }
                badge={
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
                    {group.mobilizations.length} employee(s)
                  </span>
                }
                defaultOpen={groupedMobilizations.length === 1}
              >
                <div className="overflow-x-auto -mx-4">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Trade
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Mob Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Job Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {group.mobilizations.map((mobilization) => (
                        <tr key={mobilization.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {mobilization.employee?.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {mobilization.employee?.adaa_emp_code}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {mobilization.mobilizedTrade?.skill || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getMobStatusBadge(mobilization.mobStatus)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getJobStatusBadge(mobilization.jobStatus)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {mobilization.notes || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => navigate(`/mobilizations/${mobilization.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(mobilization.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}

