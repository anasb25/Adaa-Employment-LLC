import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { mobilizationsApi } from '../services/api/mobilizationsApi';
import { Mobilization, MobilizationFilters } from '../types/mobilization';
import { MOB_STATUS_COLORS, JOB_STATUS_COLORS } from '../lib/mobilizationConstants';
import Button from '../components/ui/button/Button';
import Select from '../components/form/Select';
import { PlusIcon, BuildingIcon, GroupIcon, DownloadIcon, FileIcon } from '../icons';
import MobilizationImportModal from '../components/mobilizations/MobilizationImportModal';
import { downloadFile } from '../utils/excelValidator';

export default function MobilizationManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MobilizationFilters>({});
  const [page, setPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const limit = 20;

  // Fetch mobilizations
  const { data, isLoading } = useQuery({
    queryKey: ['mobilizations', filters, page, limit],
    queryFn: () => mobilizationsApi.getAll({ ...filters, page, limit }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => mobilizationsApi.delete(id),
    onSuccess: () => {
      toast.success('Mobilization deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['mobilizations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete mobilization');
    },
  });

  // Export mobilizations mutation
  const exportMutation = useMutation({
    mutationFn: () => mobilizationsApi.exportMobilizations(),
    onSuccess: (blob) => {
      downloadFile(blob, `mobilizations_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Mobilizations exported successfully!");
    },
    onError: () => {
      toast.error("Failed to export mobilizations");
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this mobilization record?')) {
      deleteMutation.mutate(id);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mobilization Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage employee mobilizations, demobilizations, and job statuses
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => exportMutation.mutate()}
            variant="outline"
            leftIcon={<DownloadIcon className="h-5 w-5" />}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? "Exporting..." : "Export"}
          </Button>
          <Button
            onClick={() => setIsImportModalOpen(true)}
            variant="outline"
            leftIcon={<FileIcon className="h-5 w-5" />}
          >
            Import
          </Button>
          <Button
            onClick={() => navigate('/mobilizations/create')}
            leftIcon={<PlusIcon className="h-5 w-5" />}
          >
            New Mobilization
          </Button>
        </div>
      </div>

      {/* Import Modal */}
      <MobilizationImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Records</dt>
                <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{data?.total || 0}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mob Status
            </label>
            <Select
              options={[
                { value: '', label: 'All' },
                { value: 'mobilized', label: 'Mobilized' },
                { value: 'demobilized', label: 'Demobilized' },
              ]}
              value={filters.mobStatus || ''}
              onChange={(value) => setFilters({ ...filters, mobStatus: value as any })}
              placeholder="All"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Status
            </label>
            <Select
              options={[
                { value: '', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'absconded', label: 'Absconded' },
                { value: 'on_vacation', label: 'On Vacation' },
                { value: 'absent', label: 'Absent' },
                { value: 'sick_leave', label: 'Sick Leave' },
                { value: 'casual_leave', label: 'Casual Leave' },
                { value: 'notice_period', label: 'Notice Period' },
                { value: 'resigned', label: 'Resigned' },
                { value: 'idle', label: 'Idle' },
              ]}
              value={filters.jobStatus || ''}
              onChange={(value) => setFilters({ ...filters, jobStatus: value as any })}
              placeholder="All"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setFilters({})}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Mobilizations Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mob Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Job Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-white/[0.03] divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading mobilizations...
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    No mobilizations found. Create one to get started.
                  </td>
                </tr>
              ) : (
                data?.data?.map((mobilization: Mobilization) => (
                  <tr key={mobilization.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {mobilization.employee?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {mobilization.employee?.adaa_emp_code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {mobilization.mobilizedTrade?.skill || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mobilization.project ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {mobilization.project.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {mobilization.project.client?.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">No Project</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getMobStatusBadge(mobilization.mobStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getJobStatusBadge(mobilization.jobStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(mobilization.actionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.data?.length > 0 && (
          <div className="bg-white dark:bg-white/[0.03] px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page >= (data?.totalPages || 1)}
                variant="outline"
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * limit, data?.total || 0)}
                  </span>{' '}
                  of <span className="font-medium">{data?.total || 0}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    variant="outline"
                    className="rounded-l-md"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= (data?.totalPages || 1)}
                    variant="outline"
                    className="rounded-r-md"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

