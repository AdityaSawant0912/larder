import { redirect } from "next/navigation";

export default async function HouseholdIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/households/${id}/pantry`);
}
