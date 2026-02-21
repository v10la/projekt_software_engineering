import { notFound } from "next/navigation";
import { getGiftWithTasks } from "@/lib/actions/gifts";
import { getOccasions } from "@/lib/actions/occasions";
import GiftEditForm from "@/components/GiftEditForm";

export default async function GiftEditPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const gift = await getGiftWithTasks(id);
  if (!gift) notFound();

  const occasions = await getOccasions();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Gift</h1>
        <p className="text-muted-foreground mt-1">
          Update gift details and manage tasks
        </p>
      </div>
      <GiftEditForm gift={gift} occasions={occasions} />
    </div>
  );
}
