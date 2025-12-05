import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { timesheetsApi } from "../services/api/timesheetsApi";
import { QUERY_KEYS } from "../lib/constants";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import DatePicker from "../components/form/date-picker";
import Button from "../components/ui/button/Button";
import { ChevronLeftIcon, AngleRightIcon } from "../icons";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../components/ui/table";

interface DashboardAnalytics {
  projectWise: Array<{
    project: string;
    headCount: number;
    totalHours: number;
  }>;
  statusWise: Array<{
    status: string;
    headCount: number;
    totalHours: number;
  }>;
  fatStatusWise: Array<{
    fat: string;
    headCount: number;
    totalHours: number;
  }>;
  fatSubStatusWise: Array<{
    fat: string;
    subStatuses: Array<{
      status: string;
      headCount: number;
      totalHours: number;
    }>;
    total: {
      headCount: number;
      totalHours: number;
    };
  }>;
  projectLocationWise: Array<{
    project: string;
    locations: Array<{
      location: string;
      count: number;
      totalHours: number;
    }>;
    total: {
      count: number;
      totalHours: number;
    };
  }>;
  locationTradeWise: Array<{
    location: string;
    trades: Array<{
      trade: string;
      count: number;
      totalHours: number;
    }>;
    total: {
      count: number;
      totalHours: number;
    };
  }>;
  grandTotal: {
    headCount: number;
    totalHours: number;
  };
}

export default function TimesheetDashboard() {
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);

  const { data: analytics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: [
      ...QUERY_KEYS.timesheets.all,
      "dashboard",
      startDate,
      endDate,
    ],
    queryFn: () =>
      timesheetsApi.getDashboardAnalytics({
        startDate,
        endDate,
      }),
  });

  const applyPreset = (preset: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start: Date;
    let end: Date = new Date(today);

    switch (preset) {
      case "today":
        start = new Date(today);
        break;
      case "thisWeek":
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        break;
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "lastMonth":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "last7Days":
        start = new Date(today);
        start.setDate(today.getDate() - 6);
        break;
      case "last30Days":
        start = new Date(today);
        start.setDate(today.getDate() - 29);
        break;
      default:
        start = new Date(today);
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const navigateDateRange = (direction: "prev" | "next") => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (direction === "prev") {
      start.setDate(start.getDate() - (daysDiff + 1));
      end.setDate(end.getDate() - (daysDiff + 1));
    } else {
      start.setDate(start.getDate() + (daysDiff + 1));
      end.setDate(end.getDate() + (daysDiff + 1));
    }
    
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const formatNumber = (num: number) => {
    return num.toFixed(2).replace(/\.?0+$/, "");
  };

  return (
    <PermissionGuard permission="timesheet:read">
      <PageMeta title="Timesheet Dashboard" />
      <PageBreadcrumb pageTitle="Timesheet Dashboard" />

      <div className="space-y-6">
        {/* Date Range Filter */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="space-y-4">
            {/* Preset Buttons */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("today")}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("thisWeek")}
                >
                  This Week
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("thisMonth")}
                >
                  This Month
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("lastMonth")}
                >
                  Last Month
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("last7Days")}
                >
                  Last 7 Days
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("last30Days")}
                >
                  Last 30 Days
                </Button>
              </div>
            </div>

            {/* Date Range Pickers */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDateRange("prev")}
                  className="px-3"
                  title="Previous period"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 text-xs text-gray-600 dark:text-gray-400">
                      Start Date
                    </label>
                    <DatePicker
                      id="startDate"
                      placeholder="Start date"
                      defaultDate={startDate ? new Date(startDate) : new Date()}
                      onChange={(_dates, dateStr) => {
                        setStartDate(dateStr);
                        if (dateStr > endDate) {
                          setEndDate(dateStr);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs text-gray-600 dark:text-gray-400">
                      End Date
                    </label>
                    <DatePicker
                      id="endDate"
                      placeholder="End date"
                      defaultDate={endDate ? new Date(endDate) : new Date()}
                      onChange={(_dates, dateStr) => {
                        setEndDate(dateStr);
                        if (dateStr < startDate) {
                          setStartDate(dateStr);
                        }
                      }}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDateRange("next")}
                  className="px-3"
                  title="Next period"
                >
                  <AngleRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Wise */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Project Wise
              </h3>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Row Label
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Head Count
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Sum of Total Hours
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {analytics.projectWise.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                          {item.project}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                          {item.headCount}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                          {formatNumber(item.totalHours)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-gray-50 dark:bg-gray-800/50">
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        Grand Total
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {analytics.projectWise.reduce((sum, item) => sum + item.headCount, 0)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {formatNumber(analytics.projectWise.reduce((sum, item) => sum + item.totalHours, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Status Wise */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Status Wise
              </h3>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Row Label
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Head Count
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Sum of Total Hours
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {analytics.statusWise.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                          {item.status}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                          {item.headCount}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                          {formatNumber(item.totalHours)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-gray-50 dark:bg-gray-800/50">
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        Grand Total
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {analytics.statusWise.reduce((sum, item) => sum + item.headCount, 0)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {formatNumber(analytics.statusWise.reduce((sum, item) => sum + item.totalHours, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* FAT Status Wise */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                FAT Status Wise
              </h3>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        FAT
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Head Count
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Sum of Total Hours
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {analytics.fatStatusWise.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                          {item.fat}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                          {item.headCount}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                          {formatNumber(item.totalHours)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-gray-50 dark:bg-gray-800/50">
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        Grand Total
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {analytics.fatStatusWise.reduce((sum, item) => sum + item.headCount, 0)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {formatNumber(analytics.fatStatusWise.reduce((sum, item) => sum + item.totalHours, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* FAT sub-status Wise */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                FAT sub-status Wise
              </h3>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        FAT
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Salary S
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Head Count
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Sum of Total Hours
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {analytics.fatSubStatusWise.map((fatItem, fatIdx) => (
                      <>
                        {fatItem.subStatuses.map((subItem, subIdx) => (
                          <TableRow key={`${fatIdx}-${subIdx}`}>
                            <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                              {subIdx === 0 ? fatItem.fat : ""}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 text-start">
                              —
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                              {subItem.headCount}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                              {formatNumber(subItem.totalHours)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow
                          key={`${fatIdx}-total`}
                          className="font-semibold bg-gray-50 dark:bg-gray-800/50"
                        >
                          <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                            {fatItem.fat} Total
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 text-start">
                            —
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                            {fatItem.total.headCount}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                            {formatNumber(fatItem.total.totalHours)}
                          </TableCell>
                        </TableRow>
                      </>
                    ))}
                    <TableRow className="font-semibold bg-gray-50 dark:bg-gray-800/50">
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        Grand Total
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 text-start">
                        —
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {analytics.fatSubStatusWise.reduce((sum, fatItem) => 
                          sum + fatItem.subStatuses.reduce((subSum, subItem) => subSum + subItem.headCount, 0), 0
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {formatNumber(analytics.fatSubStatusWise.reduce((sum, fatItem) => 
                          sum + fatItem.subStatuses.reduce((subSum, subItem) => subSum + subItem.totalHours, 0), 0
                        ))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Location & Trade In Site Wise */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Location & Trade In Site Wise
              </h3>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Location
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Trade In Site
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Count
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Sum of Total Hours
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {analytics.locationTradeWise.map((locationItem, locIdx) => (
                      <>
                        {locationItem.trades.map((tradeItem, tradeIdx) => (
                          <TableRow key={`${locIdx}-${tradeIdx}`}>
                            <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                              {tradeIdx === 0 ? locationItem.location : ""}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                              {tradeItem.trade}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                              {tradeItem.count}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                              {formatNumber(tradeItem.totalHours)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow
                          key={`${locIdx}-total`}
                          className="font-semibold bg-gray-50 dark:bg-gray-800/50"
                        >
                          <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                            {locationItem.location} Total
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 text-start">
                            —
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                            {locationItem.total.count}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                            {formatNumber(locationItem.total.totalHours)}
                          </TableCell>
                        </TableRow>
                      </>
                    ))}
                    <TableRow className="font-semibold bg-gray-50 dark:bg-gray-800/50">
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        Grand Total
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 text-start">
                        —
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {analytics.locationTradeWise.reduce((sum, locationItem) => 
                          sum + locationItem.trades.reduce((tradeSum, tradeItem) => tradeSum + tradeItem.count, 0), 0
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {formatNumber(analytics.locationTradeWise.reduce((sum, locationItem) => 
                          sum + locationItem.trades.reduce((tradeSum, tradeItem) => tradeSum + tradeItem.totalHours, 0), 0
                        ))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Project and Location Wise */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Project and Location Wise
              </h3>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Project
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Location
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Count
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400 text-start">
                        Sum of Total Hours
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {analytics.projectLocationWise.map((projectItem, projIdx) => (
                      <>
                        {projectItem.locations.map((locItem, locIdx) => (
                          <TableRow key={`${projIdx}-${locIdx}`}>
                            <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                              {locIdx === 0 ? projectItem.project : ""}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                              {locItem.location}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                              {locItem.count}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-900 dark:text-gray-100 text-start">
                              {formatNumber(locItem.totalHours)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow
                          key={`${projIdx}-total`}
                          className="font-semibold bg-gray-50 dark:bg-gray-800/50"
                        >
                          <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                            {projectItem.project} Total
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 text-start">
                            —
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                            {projectItem.total.count}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                            {formatNumber(projectItem.total.totalHours)}
                          </TableCell>
                        </TableRow>
                      </>
                    ))}
                    <TableRow className="font-semibold bg-gray-50 dark:bg-gray-800/50">
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        Grand Total
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 text-start">
                        —
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {analytics.projectLocationWise.reduce((sum, projectItem) => 
                          sum + projectItem.locations.reduce((locSum, locItem) => locSum + locItem.count, 0), 0
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-900 dark:text-white text-start">
                        {formatNumber(analytics.projectLocationWise.reduce((sum, projectItem) => 
                          sum + projectItem.locations.reduce((locSum, locItem) => locSum + locItem.totalHours, 0), 0
                        ))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

