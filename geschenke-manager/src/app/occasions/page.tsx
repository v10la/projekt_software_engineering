import { getOccasions } from "@/lib/actions/occasions";
import OccasionsClient from "@/components/OccasionsClient";

export default async function OccasionsPage() {
  const occasionsList = await getOccasions();
  return <OccasionsClient occasions={occasionsList} />;
}
