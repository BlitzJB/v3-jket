
import { CreateRequestForm } from "./create-request-form"

export default function CreateRequestPage() {
  return (
    <div className="container py-8 space-y-8 md:px-12 px-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Service Request</h1>
        <p className="text-muted-foreground">
          Create a new service request for a customer
        </p>
      </div>

      <CreateRequestForm />
    </div>
  )
} 