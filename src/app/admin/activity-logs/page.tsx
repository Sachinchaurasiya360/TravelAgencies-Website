"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { formatDateTime } from "@/lib/helpers/date";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function ActivityLogsPage() {
  const t = useT();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "30",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const res = await fetch(`/api/activity-logs?${params}`);
      const result = await res.json();

      if (result.success) {
        setLogs(result.data.logs);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch {
      toast.error(t.activityLogs.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.activityLogs.title}
        description={t.activityLogs.subtitle}
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner />
          ) : logs.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title={t.activityLogs.noLogsFound}
              description={t.activityLogs.noLogsMatch}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-4 font-medium">{t.activityLogs.timestamp}</th>
                      <th className="p-4 font-medium">{t.activityLogs.user}</th>
                      <th className="p-4 font-medium">{t.activityLogs.action}</th>
                      <th className="p-4 font-medium">{t.activityLogs.description}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="p-4">
                          <p className="font-medium">
                            {log.user?.name || t.common.system}
                          </p>
                          {log.user?.email && (
                            <p className="text-muted-foreground text-xs">
                              {log.user.email}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 max-w-md">
                          <p className="truncate">{log.description}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t p-4">
                <p className="text-muted-foreground text-sm">
                  {interpolate(t.common.pageOf, { page, total: totalPages })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t.common.prev}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    {t.common.next}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
