"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { IndianRupee, CreditCard, Banknote, CheckCircle, Clock } from "lucide-react"

export function PaymentsTab({ project, onUpdate }: { project: any, onUpdate: (p: any) => void }) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"

  const [openPayment, setOpenPayment] = useState(false)
  const [openSettlement, setOpenSettlement] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const [paymentData, setPaymentData] = useState({
    amount: "",
    type: "partial",
    paidDate: new Date().toISOString().split('T')[0],
    transactionId: "",
    paymentMethod: "",
    note: ""
  })

  const [settlementData, setSettlementData] = useState({
    settledAmount: "",
    settledDate: new Date().toISOString().split('T')[0],
    settledTransactionId: ""
  })

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/projects/${project._id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentData,
          amount: Number(paymentData.amount)
        }),
      })

      if (res.ok) {
        toast.success("Payment recorded successfully")
        const updatedProject = await res.json()
        onUpdate(updatedProject)
        setOpenPayment(false)
        setPaymentData({ amount: "", type: "partial", paidDate: new Date().toISOString().split('T')[0], transactionId: "", paymentMethod: "", note: "" })
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to record payment")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleAddSettlement = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/projects/${project._id}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser._id,
          ...settlementData,
          settledAmount: Number(settlementData.settledAmount)
        }),
      })

      if (res.ok) {
        toast.success("Settlement recorded successfully")
        const updatedProject = await res.json()
        onUpdate(updatedProject)
        setOpenSettlement(false)
        setSettlementData({ settledAmount: "", settledDate: new Date().toISOString().split('T')[0], settledTransactionId: "" })
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to record settlement")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const progressPercent = project.payment?.totalAmount > 0
    ? Math.min(100, Math.round((project.payment.amountReceived / project.payment.totalAmount) * 100))
    : 0;

  const getSettledForUser = (userId: string) => {
    return project.settlements?.filter((s:any) => s.user === userId).reduce((sum:number, s:any) => sum + s.settledAmount, 0) || 0;
  }

  const renderMemberEarnings = (user: any, sharePercent: number) => {
    if (!user) return null;

    const earnedAmount = (project.payment?.amountReceived * sharePercent) / 100;
    const settledAmount = getSettledForUser(user._id);
    const pendingSettlement = Math.max(0, earnedAmount - settledAmount);

    return (
      <div key={user._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center font-bold shrink-0">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium flex items-center gap-2">
                {user.name} <span className="text-xs text-slate-500 font-normal">({user.role === 'bde' ? 'BDE' : 'Dev'})</span>
            </div>
            <div className="text-sm text-slate-400">
              Share: {sharePercent}% • Earned: ₹{earnedAmount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-2">
                <Badge variant="outline" className={pendingSettlement === 0 && earnedAmount > 0 ? "border-green-500 text-green-400" : "border-yellow-500 text-yellow-400"}>
                {pendingSettlement === 0 && earnedAmount > 0 ? "Settled" : pendingSettlement > 0 ? `Pending: ₹${pendingSettlement.toLocaleString()}` : "No earnings yet"}
                </Badge>
                {isAdmin && pendingSettlement > 0 && (
                    <Button size="sm" variant="outline" className="h-6 text-xs bg-slate-900 border-slate-700" onClick={() => {
                        setSelectedUser(user);
                        setSettlementData(prev => ({...prev, settledAmount: pendingSettlement.toString()}));
                        setOpenSettlement(true);
                    }}>
                        Mark Settled
                    </Button>
                )}
            </div>
            <div className="text-xs text-slate-500">
                Total Settled: ₹{settledAmount.toLocaleString()}
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Budget</p>
                <h4 className="text-2xl font-bold mt-1">₹{(project.payment?.totalAmount || 0).toLocaleString()}</h4>
              </div>
              <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">Amount Received</p>
                <h4 className="text-2xl font-bold mt-1 text-green-500">₹{(project.payment?.amountReceived || 0).toLocaleString()}</h4>
              </div>
              <div className="h-10 w-10 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                <Banknote className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">Pending Amount</p>
                <h4 className="text-2xl font-bold mt-1 text-yellow-500">₹{(project.payment?.amountPending || 0).toLocaleString()}</h4>
              </div>
              <div className="h-10 w-10 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardContent className="p-6">
           <div className="flex justify-between items-center mb-2">
             <span className="text-sm font-medium text-slate-300">Collection Progress</span>
             <Badge variant="outline" className={`
                ${project.payment?.paymentStatus === 'fully_paid' ? 'border-green-500 text-green-400' : ''}
                ${project.payment?.paymentStatus === 'partially_paid' ? 'border-yellow-500 text-yellow-400' : ''}
                ${project.payment?.paymentStatus === 'unpaid' ? 'border-red-500 text-red-400' : ''}
                ${project.payment?.paymentStatus === 'overdue' ? 'border-red-600 bg-red-600/10 text-red-500' : ''}
              `}>
                {project.payment?.paymentStatus?.replace('_', ' ').toUpperCase() || 'UNPAID'}
              </Badge>
           </div>
           <div className="w-full bg-slate-800 rounded-full h-3 mb-1">
             <div className="bg-green-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
           </div>
           <p className="text-xs text-right text-slate-400">{progressPercent}% Collected</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
          {/* Earnings Column */}
          <Card className="bg-slate-900 border-slate-800 text-white">
              <CardHeader>
                  <CardTitle className="text-lg">Team Earnings & Settlements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  {project.assignedBDE && renderMemberEarnings(project.assignedBDE, project.sharePercentages?.bde || 0)}
                  {project.assignedDevelopers?.map((dev:any, i:number) => renderMemberEarnings(dev, project.sharePercentages?.developers?.[i] || 0))}
                  {(!project.assignedBDE && (!project.assignedDevelopers || project.assignedDevelopers.length === 0)) && (
                      <div className="text-slate-400 text-center py-4">No team members assigned yet.</div>
                  )}
              </CardContent>
          </Card>

          {/* Transactions Column */}
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Transaction History</CardTitle>
                {isAdmin && (
                    <Dialog open={openPayment} onOpenChange={setOpenPayment}>


                            <Button onClick={() => setOpenPayment(true)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                Add Payment
                            </Button>


                        <DialogContent className="w-full w-[95vw] max-w-[95vw] sm:w-full sm:max-w-[500px] mx-auto bg-slate-900 text-white border-slate-800">
                            <DialogHeader>
                                <DialogTitle>Record Payment Received</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[70vh] overflow-y-auto px-1">
                            <form onSubmit={handleAddPayment} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Amount (₹)</Label>
                                        <Input type="number" required value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} className="bg-slate-950 border-slate-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Payment Date</Label>
                                        <Input type="date" required value={paymentData.paidDate} onChange={e => setPaymentData({...paymentData, paidDate: e.target.value})} className="bg-slate-950 border-slate-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Payment Type</Label>
                                        <Select value={paymentData.type} onValueChange={(val) => setPaymentData({...paymentData, type: val || ""})}>
                                            <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue/></SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                <SelectItem value="advance">Advance</SelectItem>
                                                <SelectItem value="partial">Partial</SelectItem>
                                                <SelectItem value="final">Final</SelectItem>
                                                <SelectItem value="bonus">Bonus</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Method (e.g. UPI, Bank)</Label>
                                        <Input value={paymentData.paymentMethod} onChange={e => setPaymentData({...paymentData, paymentMethod: e.target.value})} className="bg-slate-950 border-slate-800" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Transaction ID / UTR</Label>
                                    <Input value={paymentData.transactionId} onChange={e => setPaymentData({...paymentData, transactionId: e.target.value})} className="bg-slate-950 border-slate-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes (Optional)</Label>
                                    <Textarea value={paymentData.note} onChange={e => setPaymentData({...paymentData, note: e.target.value})} className="bg-slate-950 border-slate-800" />
                                </div>
                                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Save Payment</Button>
                            </form>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent>
                {project.payment?.transactions && project.payment.transactions.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {project.payment.transactions.slice().reverse().map((t:any, idx:number) => (
                            <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-800 text-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-medium text-green-400">+ ₹{t.amount?.toLocaleString()}</div>
                                    <div className="text-slate-500 text-xs">{new Date(t.paidDate).toLocaleDateString()}</div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-slate-400 text-xs space-y-1">
                                        <div className="capitalize">Type: {t.type}</div>
                                        {t.paymentMethod && <div>Method: {t.paymentMethod}</div>}
                                        {t.transactionId && <div className="font-mono">ID: {t.transactionId}</div>}
                                    </div>
                                    {t.note && <div className="text-slate-500 text-xs max-w-[50%] truncate" title={t.note}>{t.note}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-slate-500 text-center py-8">No transactions recorded yet.</div>
                )}
            </CardContent>
          </Card>
      </div>

      {/* Settlement Modal */}
      <Dialog open={openSettlement} onOpenChange={setOpenSettlement}>
        <DialogContent className="w-full w-[95vw] max-w-[95vw] sm:w-full sm:max-w-[400px] mx-auto bg-slate-900 text-white border-slate-800">
            <DialogHeader>
                <DialogTitle>Mark Settlement for {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSettlement} className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label>Amount to Settle (₹)</Label>
                    <Input type="number" required value={settlementData.settledAmount} onChange={e => setSettlementData({...settlementData, settledAmount: e.target.value})} className="bg-slate-950 border-slate-800" />
                </div>
                <div className="space-y-2">
                    <Label>Settlement Date</Label>
                    <Input type="date" required value={settlementData.settledDate} onChange={e => setSettlementData({...settlementData, settledDate: e.target.value})} className="bg-slate-950 border-slate-800" />
                </div>
                <div className="space-y-2">
                    <Label>Transaction ID (Optional)</Label>
                    <Input value={settlementData.settledTransactionId} onChange={e => setSettlementData({...settlementData, settledTransactionId: e.target.value})} className="bg-slate-950 border-slate-800" />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Confirm Settlement</Button>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
