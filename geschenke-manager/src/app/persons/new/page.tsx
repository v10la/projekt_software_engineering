import PersonForm from "@/components/PersonForm";

export default function NewPersonPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Person</h1>
        <p className="text-muted-foreground mt-1">
          Add a new person to your gift list
        </p>
      </div>
      <PersonForm />
    </div>
  );
}
