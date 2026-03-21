import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ComingSoonPanel({
  title,
  description,
  bullets,
  backHref = "/admin",
}: {
  title: string;
  description: string;
  bullets: string[];
  backHref?: string;
}) {
  return (
    <div className="p-8">
      <Card className="max-w-3xl border-dashed">
        <CardHeader className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Construction className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {bullets.map((bullet) => (
              <li key={bullet} className="rounded-lg bg-accent/40 px-3 py-2">
                {bullet}
              </li>
            ))}
          </ul>
          <Button asChild>
            <Link href={backHref} className="inline-flex items-center gap-2">
              返回管理后台
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
