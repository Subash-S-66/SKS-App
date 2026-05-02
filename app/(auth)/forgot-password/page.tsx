"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
        const res = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        })

        if (res.ok) {
            toast.success("OTP sent to your email!")
            setSent(true)
            setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}`)
            }, 1500)
        } else {
            toast.error("Failed to send OTP")
        }
    } catch (error) {
        toast.error("An error occurred")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white">
        <CardHeader className="space-y-1">
          <Link href="/login" className="flex items-center text-sm text-slate-400 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
          </Link>
          <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your email to receive a 6-digit OTP.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                disabled={sent}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-600"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]" disabled={loading || sent}>
              {loading ? "Sending..." : sent ? "Sent!" : "Send OTP"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
