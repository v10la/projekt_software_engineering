import { notFound } from "next/navigation";
import { getPersonWithGifts } from "@/lib/actions/persons";
import { getOccasions } from "@/lib/actions/occasions";
import PersonDetail from "@/components/PersonDetail";

export default async function PersonDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const person = await getPersonWithGifts(id);
  if (!person) notFound();

  const allOccasions = await getOccasions();

  return <PersonDetail person={person} occasions={allOccasions} />;
}
