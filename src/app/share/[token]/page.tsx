import { notFound } from "next/navigation";
import { getSharedData } from "@/lib/actions/share";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, ExternalLink } from "lucide-react";

export default async function SharedPage({
  params,
}: {
  params: { token: string };
}) {
  const data = await getSharedData(params.token);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">
            Geschenkideen für {data.person.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Geteilte Geschenkeliste — {data.ideas.length} Einträge
          </p>
        </div>

        {data.ideas.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Noch keine Geschenkideen geteilt.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.ideas.map((idea) => {
              const links = idea.links && idea.links.length > 0 ? idea.links : idea.link ? [idea.link] : [];
              const images = idea.images && idea.images.length > 0 ? idea.images : idea.imagePath ? [idea.imagePath] : [];
              return (
                <Card key={idea.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{idea.title}</h3>
                        {idea.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {idea.description}
                          </p>
                        )}
                        {links.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {links.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {url.length > 40 ? url.substring(0, 40) + "..." : url}
                              </a>
                            ))}
                          </div>
                        )}
                        {images.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {images.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`${idea.title} ${i + 1}`}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {idea.occasionName && (
                        <Badge variant="outline">{idea.occasionName}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Powered by Geschenke-Manager
        </p>
      </div>
    </div>
  );
}
