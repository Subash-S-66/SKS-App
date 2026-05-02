"use client"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
      const e = searchParams.get('email')
      if (e) setEmail(e)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
        const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp, newPassword })
        })

        if (res.ok) {
            toast.success("Password reset successfully!")
            setTimeout(() => {
                router.push("/login")
            }, 1500)
        } else {
            const data = await res.json()
            toast.error(data.error || "Failed to reset password")
        }
    } catch (error) {
        toast.error("An error occurred")
    } finally {
        setLoading(false)
    }
  }

  return (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                required
                readOnly={!!searchParams.get('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-400 focus-visible:ring-0 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-slate-300">6-Digit OTP</Label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-600 tracking-widest text-center text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-600"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </CardFooter>
        </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
          <CardDescription className="text-slate-400">
            Enter the OTP sent to your email and your new password.
          </CardDescription>
        </CardHeader>
        <Suspense fallback={<CardContent className="p-8 text-center text-slate-400">Loading...</CardContent>}>
            <ResetPasswordForm />
        </Suspense>
      </Card>
    </div>
  )
}
