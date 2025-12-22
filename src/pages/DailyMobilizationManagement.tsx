import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { mobilizationsApi } from '../services/api/mobilizationsApi';
import { Mobilization } from '../types/mobilization';
import { MOB_STATUS_COLORS, JOB_STATUS_COLORS } from '../lib/mobilizationConstants';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';
import PermissionGuard from '../components/auth/PermissionGuard';
import Button from '../components/ui/button/Button';
import Label from '../components/form/Label';
import Input from '../components/form/input/InputField';
import { Accordion, AccordionItem } from '../components/ui/accordion/Accordion';
import DailyMobilizationImportModal from '../components/mobilizations/DailyMobilizationImportModal';
import EmployeeMobilizationHistoryModal from '../components/mobilizations/EmployeeMobilizationHistoryModal';
import { PlusIcon, FileIcon, CalenderIcon, DownloadIcon, BuildingIcon, GroupIcon, TimeIcon } from '../icons';
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
  const [showCarryForward, setShowCarryForward] = useState(false); // Default to false (real records only)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMobStatus, setFilterMobStatus] = useState<string | null>(null); // null = all, 'mobilized', 'demobilized'
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    employeeId: number;
    employeeName: string;
  }>({
    isOpen: false,
    employeeId: 0,
    employeeName: '',
  });

  // Fetch mobilizations based on toggle setting
  const { data: mobilizations, isLoading } = useQuery({
    queryKey: ['daily-mobilizations', selectedDate, showCarryForward],
    queryFn: async () => {
      if (showCarryForward) {
        // Carry-forward view: show effective status for all employees on this date
        const effectiveStatus = await mobilizationsApi.getEffectiveStatusForAllEmployeesOnDate(
          selectedDate
        );
        return {
          data: effectiveStatus,
          total: effectiveStatus.length,
          page: 1,
          limit: 1000,
          totalPages: 1,
        };
      } else {
        // Real records only: fetch records actually created on this specific date
        return mobilizationsApi.getAll({
          actionDate: selectedDate,
          page: 1,
          limit: 1000,
        });
      }
    },
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

  // Filter and group mobilizations by project
  const groupedMobilizations: ProjectGroup[] = (() => {
    if (!mobilizations?.data) return [];

    // Apply filters
    let filtered = mobilizations.data;

    // Filter by mob status
    if (filterMobStatus) {
      filtered = filtered.filter((mob: Mobilization) => mob.mobStatus === filterMobStatus);
    }

    // Filter by search query (name or adaa_emp_code)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((mob: Mobilization) => {
        const name = mob.employee?.name?.toLowerCase() || '';
        const code = mob.employee?.adaa_emp_code?.toLowerCase() || '';
        return name.includes(query) || code.includes(query);
      });
    }

    const groups = new Map<number | null, ProjectGroup>();

    filtered.forEach((mob: Mobilization) => {
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
  
  // Counts for filtered view
  const filteredCount = groupedMobilizations.reduce((sum, group) => sum + group.mobilizations.length, 0);

  return (
    <>
      <PageMeta
        title="Daily Mobilization Management | ADAA Employment LLC"
        description="Manage daily employee mobilizations and status records"
      />
      <PermissionGuard
        permission="employee:read"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access mobilizations.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="Daily Mobilizations" />

        <div className="space-y-6">
          {/* Date Selection & Actions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label>
                  Select Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formattedDate}
                </p>
                {showCarryForward && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-md">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Showing effective status (carry-forward)
                  </div>
                )}
              </div>

              <div>
                <Label>Search</Label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <Input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>View Mode</Label>
                <button
                  onClick={() => setShowCarryForward(!showCarryForward)}
                  className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all w-full justify-center ${
                    showCarryForward
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {showCarryForward ? 'Show Real Records Only' : 'Show Carry-Forward'}
                </button>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {showCarryForward
                    ? 'Displaying effective status for all employees'
                    : 'Displaying only records created on this date'}
                </p>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={() => exportMutation.mutate()}
                  variant="outline"
                  startIcon={<DownloadIcon className="h-5 w-5" />}
                  disabled={exportMutation.isPending || totalMobilizations === 0}
                  className="flex-1"
                >
                  Export
                </Button>
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  variant="outline"
                  startIcon={<FileIcon className="h-5 w-5" />}
                  className="flex-1"
                >
                  Import
                </Button>
                <Button
                  onClick={handleCreateManual}
                  startIcon={<PlusIcon />}
                  className="flex-1"
                >
                  Create
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

      {/* Employee History Modal */}
      <EmployeeMobilizationHistoryModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ isOpen: false, employeeId: 0, employeeName: '' })}
        employeeId={historyModal.employeeId}
        employeeName={historyModal.employeeName}
      />

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          onClick={() => setFilterMobStatus(filterMobStatus === 'mobilized' ? null : 'mobilized')}
          className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
            filterMobStatus === 'mobilized'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
              : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mobilized</p>
              <p className={`text-2xl font-bold mt-1 ${
                filterMobStatus === 'mobilized'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {mobilizedCount}
              </p>
            </div>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              filterMobStatus === 'mobilized'
                ? 'bg-green-100 dark:bg-green-900/40'
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterMobStatus(filterMobStatus === 'demobilized' ? null : 'demobilized')}
          className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
            filterMobStatus === 'demobilized'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
              : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Demobilized</p>
              <p className={`text-2xl font-bold mt-1 ${
                filterMobStatus === 'demobilized'
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {demobilizedCount}
              </p>
            </div>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              filterMobStatus === 'demobilized'
                ? 'bg-red-100 dark:bg-red-900/40'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterMobStatus(null)}
          className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
            filterMobStatus === null
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
              : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className={`text-2xl font-bold mt-1 ${
                filterMobStatus === null
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {totalMobilizations}
              </p>
              {filterMobStatus && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Showing: {filteredCount}
                </p>
              )}
            </div>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              filterMobStatus === null
                ? 'bg-blue-100 dark:bg-blue-900/40'
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              <GroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </button>
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
                        {showCarryForward && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Trade In Site
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
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                          {showCarryForward && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {new Date(mobilization.actionDate).toLocaleDateString()}
                            </td>
                          )}
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
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  setHistoryModal({
                                    isOpen: true,
                                    employeeId: mobilization.employeeId,
                                    employeeName: mobilization.employee?.name || 'Unknown',
                                  })
                                }
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                title="View History"
                              >
                                <TimeIcon className="h-4 w-4 inline mr-1" />
                                History
                              </button>
                              <span className="text-gray-300 dark:text-gray-700">|</span>
                              <button
                                onClick={() => navigate(`/mobilizations/${mobilization.id}/edit`)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <span className="text-gray-300 dark:text-gray-700">|</span>
                              <button
                                onClick={() => handleDelete(mobilization.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
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
      </PermissionGuard>
    </>
  );
}

