import LocationSafetyAnalysis from "@/components/LocationSafetyAnalysis"
import LogoutButton from "@/components/Logout"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

export default async function Dashboard() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your safe commute dashboard!</p>
      <LocationSafetyAnalysis/>
      <LogoutButton/>
    </div>
  )
}