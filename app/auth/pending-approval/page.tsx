import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, LogOut } from "lucide-react"

export default async function PendingApprovalPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login')
  }

  // If user is approved, redirect them to dashboard
  if (session.user.approved) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-2">
            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account is currently awaiting approval from an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Account Details:</strong>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="font-medium">{session.user.email}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="font-medium">{session.user.name}</span>
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You will receive an email notification once your account has been approved.
              Please check back later or contact your administrator if you have any questions.
            </p>
          </div>

          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/auth/login" })
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
