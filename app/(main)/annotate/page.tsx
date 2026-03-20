"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BBoxCanvas, { type BBox } from "@/components/annotation/BBoxCanvas";
import ThoughtInput, { type ThoughtData } from "@/components/annotation/ThoughtInput";
import LocationMap from "@/components/map/LocationMap";
import { getNextTask, getTempFileURL, submitAnnotation } from "@/lib/cloudbase";
import { useAuthStore } from "@/lib/auth";
import { getAnnotationTypeName, getModeName } from "@/lib/modes";

interface Task {
  id: number;
  storage_url: string;
  mode_tags: string[];
  difficulty: number;
  lat?: number | null;
  lng?: number | null;
  true_location?: string | null;
  imageUrl?: string;
}

const INIT_THOUGHT: ThoughtData = {
  thought_text: "",
  final_answer: "",
  confidence: 50,
};

function AnnotateContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const annotationType = searchParams.get("annotationType") ?? "hybrid";
  const user = useAuthStore((state) => state.user);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bboxes, setBboxes] = useState<BBox[]>([]);
  const [thought, setThought] = useState<ThoughtData>(INIT_THOUGHT);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const needsReasoning = annotationType === "reasoning" || annotationType === "hybrid";
  const needsBoxes = annotationType === "bbox" || annotationType === "hybrid";

  const loadTask = async () => {
    setLoading(true);
    setError(null);
    setBboxes([]);
    setThought(INIT_THOUGHT);
    setSubmitted(false);

    try {
      const response = await getNextTask(mode ? { mode } : undefined);
      if (!response.task) {
        setTask(null);
        setError("No task is currently available for the selected mode.");
        return;
      }

      let imageUrl = response.task.storage_url;
      if (imageUrl.startsWith("cloud://") || imageUrl.startsWith("cos://")) {
        const file = await getTempFileURL(imageUrl);
        imageUrl = file.tempFileURL;
      }

      setTask({ ...response.task, imageUrl });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Failed to load the next task."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, annotationType]);

  const handleSubmit = async () => {
    if (!task || !mode) {
      return;
    }

    if (needsReasoning && thought.thought_text.trim().length < 20) {
      setError("Reasoning capture requires at least 20 characters of explanation.");
      return;
    }

    if (needsBoxes && bboxes.length === 0) {
      setError("Geo-element mode requires at least one bounding box.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitAnnotation({
        image_id: task.id,
        mode_type: mode,
        annotation_type: annotationType,
        thought_text: needsReasoning ? thought.thought_text : "",
        final_answer: needsReasoning ? thought.final_answer : "",
        confidence: needsReasoning ? thought.confidence : 50,
        cloudbase_uid: user?.uid,
        email: user?.email,
        bboxes: needsBoxes
          ? bboxes.map((bbox) => ({
              x: bbox.x,
              y: bbox.y,
              width: bbox.width,
              height: bbox.height,
              label_type: bbox.label_type,
              explanation: bbox.explanation,
            }))
          : [],
      });
      setSubmitted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mode) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          Choose a mode before entering the annotation task page.
        </p>
        <Button asChild>
          <Link href="/app/annotate/mode">Open mode selector</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Submission recorded</h2>
        <p className="text-muted-foreground mb-6">
          The annotation is stored and can now flow into review, export, and points logic.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={loadTask}>Next task</Button>
          <Button asChild variant="outline">
            <Link href="/app/home">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          {error ?? "No task is currently available."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={loadTask}>
            Retry
          </Button>
          <Button asChild variant="ghost">
            <Link href="/app/annotate/mode">Switch mode</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary">
            Annotation task
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            {getModeName(mode)} / {getAnnotationTypeName(annotationType)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Difficulty {task.difficulty} | Dataset tags:{" "}
            {task.mode_tags.map(getModeName).join(", ") || "General"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/annotate/mode">Change setup</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={loadTask}>
            Load another task
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        {needsBoxes ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Geo-element annotation</CardTitle>
            </CardHeader>
            <CardContent>
              {task.imageUrl ? (
                <BBoxCanvas imageUrl={task.imageUrl} bboxes={bboxes} onChange={setBboxes} />
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Task image</CardTitle>
            </CardHeader>
            <CardContent>
              {task.imageUrl ? (
                <img
                  src={task.imageUrl}
                  alt="Task asset"
                  className="w-full rounded-xl border border-border"
                />
              ) : null}
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {needsReasoning ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Reasoning capture</CardTitle>
              </CardHeader>
              <CardContent>
                <ThoughtInput value={thought} onChange={setThought} />
              </CardContent>
            </Card>
          ) : null}

          {task.lat != null && task.lng != null ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Ground truth location</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationMap
                  lat={task.lat}
                  lng={task.lng}
                  description={task.true_location ?? "Current task location metadata."}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Submission checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Reasoning required: {needsReasoning ? "yes" : "no"}
              </p>
              <p>Bounding box required: {needsBoxes ? "yes" : "no"}</p>
              <p>Truth location visible: {task.lat != null && task.lng != null ? "yes" : "no"}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting} className="px-8">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting
            </>
          ) : (
            "Submit annotation"
          )}
        </Button>
      </div>
    </div>
  );
}

export default function AnnotatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AnnotateContent />
    </Suspense>
  );
}
