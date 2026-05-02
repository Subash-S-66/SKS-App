"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function PaymentsTab({ project, refreshProject }: { project: any, refreshProject: () => void }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    type: "partial",
    paidDate: new Date().toISOString().split('T')[0],
    transactionId: "",
    paymentMethod: "",
    note: "",
  });

  const payment = project.payment;
  const currencySymbol = payment?.currency === "USD" ? "$" : payment?.currency === "EUR" ? "€" : "₹";

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTransaction = {
        ...formData,
        amount: Number(formData.amount),
        recordedBy: userId,
      };

      const updatedTransactions = [...(payment.transactions || []), newTransaction];

      const res = await fetch(`/api/projects/${project._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "payment.transactions": updatedTransactions }),
      });

      if (res.ok) {
        toast.success("Payment recorded");
        setIsAddOpen(false);
        setFormData({
          amount: "", type: "partial", paidDate: new Date().toISOString().split('T')[0],
          transactionId: "", paymentMethod: "", note: "",
        });
        refreshProject();
      } else {
        toast.error("Failed to record payment");
      }
    } catch {
      toast.error("Error recording payment");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "fully_paid") return <Badge variant="success">Fully Paid</Badge>;
    if (status === "partially_paid") return <Badge variant="warning">Partially Paid</Badge>;
    if (status === "overdue") return <Badge variant="danger">Overdue</Badge>;
    return <Badge variant="danger">Unpaid</Badge>;
  };

  const progressPercent = payment?.totalAmount ? Math.min(100, Math.round((payment.amountReceived / payment.totalAmount) * 100)) : 0;

  const renderEarnings = (user: any, sharePercent: number, label: string) => {
    if (!user) return null;
    const earned = (payment?.amountReceived || 0) * (sharePercent / 100);
    const totalPossible = (payment?.totalAmount || 0) * (sharePercent / 100);

    return (
      <div key={user._id} className="bg-secondary/50 rounded p-4 border border-border">
        <p className="font-medium text-sm mb-1">{user.name} <span className="text-xs text-muted-foreground ml-2">({label} - {sharePercent}%)</span></p>
        <p className="text-xs text-muted-foreground mb-2">Earned: {currencySymbol}{earned.toFixed(2)} of {currencySymbol}{totalPossible.toFixed(2)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">{currencySymbol}{payment?.totalAmount || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Received</p>
              <p className="text-2xl font-bold text-success">{currencySymbol}{payment?.amountReceived || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">{currencySymbol}{payment?.amountPending || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              {getStatusBadge(payment?.paymentStatus || "unpaid")}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Collection Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden border border-border">
              <div className="bg-success h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Transaction History</h3>
            {role === "admin" && (
              <Button size="sm" onClick={() => setIsAddOpen(true)}>Add Payment</Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Ref ID</th>
                  </tr>
                </thead>
                <tbody>
                  {!payment?.transactions || payment.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No payments recorded.</td>
                    </tr>
                  ) : (
                    payment.transactions.map((tx: any, i: number) => (
                      <tr key={i} className="border-b border-border">
                        <td className="px-4 py-3">{format(new Date(tx.paidDate || tx.createdAt), "dd MMM, yyyy")}</td>
                        <td className="px-4 py-3 font-semibold text-success">{currencySymbol}{tx.amount}</td>
                        <td className="px-4 py-3 capitalize">{tx.type}</td>
                        <td className="px-4 py-3">{tx.paymentMethod || "N/A"}</td>
                        <td className="px-4 py-3 font-mono text-xs">{tx.transactionId || "N/A"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Earnings Breakdown</h3>
          <div className="space-y-3">
            {renderEarnings(project.assignedBDE, project.sharePercentages?.bde || 20, "BDE")}
            {project.assignedDevelopers?.map((dev: any, i: number) =>
              renderEarnings(dev, project.sharePercentages?.developers?.[i] || 0, "Developer")
            )}
            <div className="bg-secondary/30 rounded p-4 border border-border border-dashed">
              <p className="font-medium text-sm mb-1 text-muted-foreground">Agency (Unallocated)</p>
              <p className="text-xs text-muted-foreground">
                Earned: {currencySymbol}{
                  (payment?.amountReceived || 0) * ((100 - (project.sharePercentages?.bde || 20) - (project.sharePercentages?.developers?.reduce((a:number,b:number)=>a+b,0) || 0)) / 100)
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Payment">
        <form onSubmit={handleAddPayment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount ({currencySymbol})</Label>
              <Input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Date Paid</Label>
              <Input type="date" required value={formData.paidDate} onChange={e => setFormData({...formData, paidDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="advance">Advance</option>
                <option value="partial">Partial</option>
                <option value="final">Final</option>
                <option value="bonus">Bonus</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Input placeholder="UPI, Bank, Cash..." value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Transaction / Ref ID</Label>
            <Input value={formData.transactionId} onChange={e => setFormData({...formData, transactionId: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit">Record Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
