"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DollarSign, Plus, Download, CheckCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export function ProjectPayments({ project, onUpdate }: { project: any, onUpdate: (p: any) => void }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    type: "advance",
    paidDate: new Date().toISOString().split("T")[0],
    transactionId: "",
    paymentMethod: "",
    note: "",
  });

  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleData, setSettleData] = useState({
    userId: "",
    settledAmount: "",
    settledTransactionId: ""
  });

  const p = project.payment || { totalAmount: 0, amountReceived: 0, amountPending: 0, currency: "INR", transactions: [], paymentStatus: "unpaid" };
  const percentReceived = p.totalAmount > 0 ? Math.round((p.amountReceived / p.totalAmount) * 100) : 0;

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${project._id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Payment recorded");
        setIsPaymentOpen(false);
        setFormData({
          amount: "",
          type: "advance",
          paidDate: new Date().toISOString().split("T")[0],
          transactionId: "",
          paymentMethod: "",
          note: "",
        });
        onUpdate(await res.json());
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to record payment");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${project._id}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settleData),
      });

      if (res.ok) {
        toast.success("Settlement recorded");
        setIsSettleOpen(false);
        onUpdate(await res.json());
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to record settlement");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getTeamShares = () => {
    const shares = [];
    if (project.assignedBDE) {
      shares.push({
        user: project.assignedBDE,
        role: "BDE",
        percentage: project.sharePercentages?.bde || 20
      });
    }
    project.assignedDevelopers?.forEach((dev: any, i: number) => {
      shares.push({
        user: dev,
        role: "Developer",
        percentage: project.sharePercentages?.developers[i] || (project.assignedDevelopers.length === 1 ? 80 : 40)
      });
    });
    return shares;
  };

  const getSettledAmount = (userId: string) => {
    const settlement = project.settlements?.find((s: any) => s.userId._id === userId || s.userId === userId);
    return settlement ? settlement.settledAmount : 0;
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'fully_paid': return <Badge className="bg-green-500">Fully Paid</Badge>;
      case 'partially_paid': return <Badge className="bg-yellow-500">Partially Paid</Badge>;
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Financial Overview</CardTitle>
              {getPaymentBadge(p.paymentStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span>{p.currency} {p.amountReceived} Received</span>
              <span className="text-slate-500">{p.currency} {p.totalAmount} Total</span>
            </div>
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${percentReceived === 100 ? 'bg-green-500' : 'bg-blue-500'} transition-all`}
                style={{ width: `${percentReceived}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 text-slate-500">
              <span>{percentReceived}% Completed</span>
              <span>Pending: {p.currency} {p.amountPending}</span>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="flex flex-col justify-center bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
            <CardContent className="p-6 text-center">
              <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogTrigger>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Client Payment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPayment} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount ({p.currency})</Label>
                        <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Type</Label>
                        <Select value={formData.type} onValueChange={(v) => { if(v) setFormData({...formData, type: v}) }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="advance">Advance</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="final">Final</SelectItem>
                            <SelectItem value="bonus">Bonus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date Received</Label>
                        <Input type="date" value={formData.paidDate} onChange={e => setFormData({...formData, paidDate: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Input value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} placeholder="UPI, Bank, Cash..." />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Transaction ID / UTR</Label>
                      <Input value={formData.transactionId} onChange={e => setFormData({...formData, transactionId: e.target.value})} placeholder="Optional..." />
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} rows={2} />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? "Saving..." : "Save Payment"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Earnings & Settlements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {getTeamShares().map((member, idx) => {
                const totalEarned = (p.totalAmount * member.percentage) / 100;
                const earnedFromReceived = (p.amountReceived * member.percentage) / 100;
                const settled = getSettledAmount(member.user._id);
                const toSettle = earnedFromReceived - settled;

                return (
                  <div key={idx} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold">{member.user.name}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">{member.role} • {member.percentage}% Share</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold">{p.currency} {earnedFromReceived}</div>
                        <div className="text-xs text-slate-500">earned of {p.currency} {totalEarned}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 bg-slate-50 dark:bg-slate-900 p-2 rounded">
                      <div className="text-sm">
                        <span className="text-slate-500 mr-2">Settled:</span>
                        <span className="font-mono text-green-600 font-medium">{p.currency} {settled}</span>
                      </div>
                      {isAdmin && toSettle > 0 ? (
                        <Dialog open={isSettleOpen && settleData.userId === member.user._id} onOpenChange={(open) => {
                          if (open) setSettleData({ userId: member.user._id, settledAmount: toSettle.toString(), settledTransactionId: "" });
                          setIsSettleOpen(open);
                        }}>
                          <DialogTrigger>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-green-200 text-green-700 bg-green-50 hover:bg-green-100">
                              Settle {p.currency} {toSettle}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Settle Payment for {member.user.name}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSettle} className="space-y-4 mt-4">
                              <div className="space-y-2">
                                <Label>Amount to Settle ({p.currency})</Label>
                                <Input type="number" value={settleData.settledAmount} onChange={e => setSettleData({...settleData, settledAmount: e.target.value})} required />
                              </div>
                              <div className="space-y-2">
                                <Label>Transaction ID (Optional)</Label>
                                <Input value={settleData.settledTransactionId} onChange={e => setSettleData({...settleData, settledTransactionId: e.target.value})} />
                              </div>
                              <Button type="submit" disabled={loading} className="w-full">Confirm Settlement</Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <div className="flex items-center text-xs text-green-600 font-medium">
                          {toSettle <= 0 && settled > 0 ? <><CheckCircle2 className="w-4 h-4 mr-1" /> All Settled</> : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {p.transactions.length === 0 ? (
              <div className="text-center p-8 text-slate-500">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No payments recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {p.transactions.slice().reverse().map((tx: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs">
                          {format(new Date(tx.paidDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {p.currency} {tx.amount}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[10px]">{tx.type}</Badge>
                          {tx.transactionId && <div className="text-[10px] text-slate-500 mt-1">Ref: {tx.transactionId}</div>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}