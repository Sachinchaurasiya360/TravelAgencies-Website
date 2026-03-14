"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  _count: { bookings: number };
}

export default function CustomersPage() {
  const t = useT();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/customers?${params}`);
      const result = await res.json();

      if (result.success) {
        setCustomers(result.data.customers);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch {
      toast.error(t.customers.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.customers.title}
        description={t.customers.subtitle}
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t.customers.searchPlaceholder}
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner />
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t.customers.noCustomersFound}
              description={t.customers.noCustomersMatch}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-4 font-medium">{t.customers.name}</th>
                      <th className="p-4 font-medium">{t.customers.phone}</th>
                      <th className="p-4 font-medium">{t.customers.email}</th>
                      <th className="p-4 font-medium">{t.customers.totalBookings}</th>
                      <th className="p-4 font-medium">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {customer.name}
                          </Link>
                        </td>
                        <td className="p-4">{customer.phone}</td>
                        <td className="p-4 text-muted-foreground">
                          {customer.email || "-"}
                        </td>
                        <td className="p-4">{customer._count.bookings}</td>
                        <td className="p-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/customers/${customer.id}`}>
                              {t.common.view}
                            </Link>
                          </Button>
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
