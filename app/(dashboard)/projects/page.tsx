"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Eye, Trash2, Search, IndianRupee } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects?status=${statusFilter}`);
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Project deleted successfully");
        fetchProjects();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete project");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const filteredProjects = projects.filter(p =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const getPaymentStatusBadge = (status: string) => {
    switch(status) {
      case 'fully_paid': return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case 'partially_paid': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Partial</Badge>;
      case 'overdue': return <Badge className="bg-red-600 hover:bg-red-700">Overdue</Badge>;
      default: return <Badge variant="destructive">Unpaid</Badge>;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Projects</h2>
        {role === "admin" && (
          <Link href="/projects/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-slate-950 p-3 md:p-4 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search clients..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500">No projects found.</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">S.No</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project._id}>
                    <TableCell className="font-medium">#{project.sNo}</TableCell>
                    <TableCell>
                      <div className="font-medium">{project.clientName}</div>
                      <div className="text-sm text-slate-500">{project.companyName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        project.status === 'completed' ? 'default' :
                        project.status === 'ongoing' ? 'secondary' : 'destructive'
                      } className={
                        project.status === 'completed' ? 'bg-green-500 hover:bg-green-600' :
                        project.status === 'ongoing' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-yellow-500 hover:bg-yellow-600'
                      }>
                        {project.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div>{getPaymentStatusBadge(project.payment?.paymentStatus || 'unpaid')}</div>
                        <div className="text-xs text-slate-500 flex items-center">
                          <IndianRupee className="w-3 h-3 mr-0.5" />
                          {project.payment?.amountReceived || 0} / {project.payment?.totalAmount || project.projectBudget}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(project.startDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/projects/${project._id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4 text-slate-500 hover:text-blue-500" />
                          </Button>
                        </Link>
                        {role === "admin" && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(project._id)}>
                            <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredProjects.map((project) => (
              <Card key={project._id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs font-semibold text-blue-500 mb-1">#{project.sNo}</div>
                      <h3 className="font-bold text-lg leading-tight">{project.clientName}</h3>
                      <p className="text-sm text-slate-500">{project.companyName}</p>
                    </div>
                    <Badge variant={
                      project.status === 'completed' ? 'default' :
                      project.status === 'ongoing' ? 'secondary' : 'destructive'
                    } className={
                      project.status === 'completed' ? 'bg-green-500' :
                      project.status === 'ongoing' ? 'bg-blue-500 text-white' : 'bg-yellow-500'
                    }>
                      {project.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-4 bg-slate-50 dark:bg-slate-900 p-2 rounded">
                    <div>
                      <p className="text-slate-500 text-xs uppercase">Payment</p>
                      <div className="flex items-center gap-1 mt-1">
                        {getPaymentStatusBadge(project.payment?.paymentStatus || 'unpaid')}
                      </div>
                      <p className="text-xs font-medium mt-1 text-slate-700 dark:text-slate-300">
                        ₹{project.payment?.amountReceived || 0} / {project.payment?.totalAmount || project.projectBudget}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs uppercase">Started</p>
                      <p className="font-medium mt-1">{format(new Date(project.startDate), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Link href={`/projects/${project._id}`} className="flex-1">
                      <Button variant="secondary" className="w-full">
                        <Eye className="h-4 w-4 mr-2" /> View Details
                      </Button>
                    </Link>
                    {role === "admin" && (
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(project._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}