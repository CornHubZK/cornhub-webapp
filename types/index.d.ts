export type ProofRequest = {
  id: string
  current_date?: string
  min_age?: number
  citizenship?: Alpha3Code
  status: "created" | "pending" | "accepted" | "verified" | "failed" | "completed"
  proof?: string
}
