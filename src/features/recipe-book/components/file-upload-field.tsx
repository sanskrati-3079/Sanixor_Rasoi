"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPLOAD_LIMITS } from "../schemas";

export type UploadedFile = { id: string; src: string };

type FileUploadFieldProps = {
  kind: "image" | "video";
  label: string;
  value: UploadedFile | null;
  onChange: (value: UploadedFile | null) => void;
  error?: string;
  fieldId: string;
};

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/quicktime,video/webm",
};

/** Uploads straight away (with progress) and reports the stored file id. */
export function FileUploadField({
  kind,
  label,
  value,
  onChange,
  error,
  fieldId,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const shownError = uploadError || error;

  function upload(file: File) {
    setUploadError("");
    if (file.size > UPLOAD_LIMITS[kind]) {
      setUploadError(
        kind === "image"
          ? "Photos must be 5 MB or smaller."
          : "Videos must be 100 MB or smaller.",
      );
      return;
    }

    const body = new FormData();
    body.append("kind", kind);
    body.append("file", file);
    const request = new XMLHttpRequest();
    request.open("POST", "/api/book/uploads");
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      setProgress(null);
      const payload = request.response as {
        upload?: UploadedFile;
        error?: { message?: string };
      } | null;
      if (request.status === 201 && payload?.upload) {
        onChange({ id: payload.upload.id, src: payload.upload.src });
      } else {
        setUploadError(
          payload?.error?.message ?? "Upload failed. Please try again.",
        );
      }
    };
    request.onerror = () => {
      setProgress(null);
      setUploadError("Upload failed. Check your connection and try again.");
    };
    setProgress(0);
    request.send(body);
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {value ? (
        <div className="flex flex-wrap items-end gap-3">
          {kind === "image" ? (
            <div className="rounded-field bg-sky relative h-32 w-44 overflow-hidden">
              <Image
                src={value.src}
                alt="Uploaded photo preview"
                fill
                unoptimized
                sizes="176px"
                className="object-cover"
              />
            </div>
          ) : (
            <video
              src={value.src}
              controls
              preload="metadata"
              className="rounded-field bg-ink aspect-video w-full max-w-sm"
            />
          )}
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Remove {kind === "image" ? "photo" : "video"}
          </Button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            id={fieldId}
            type="file"
            accept={ACCEPT[kind]}
            className="sr-only"
            aria-describedby={hintId}
            aria-invalid={shownError ? true : undefined}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
              event.target.value = "";
            }}
          />
          <label
            htmlFor={fieldId}
            className="rounded-field border-line-strong bg-canvas hover:bg-sky has-[:focus-visible]:outline-accent-strong flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-5 text-center transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2"
          >
            {kind === "image" ? (
              <ImagePlus className="text-denim size-7" aria-hidden="true" />
            ) : (
              <Video className="text-denim size-7" aria-hidden="true" />
            )}
            <span className="font-semibold">
              {progress !== null
                ? "Uploading… " + progress + "%"
                : "Choose a " + (kind === "image" ? "photo" : "video")}
            </span>
          </label>
          {progress !== null && (
            <div
              className="bg-sky mt-2 h-2 overflow-hidden rounded-full"
              role="progressbar"
              aria-label={"Uploading " + kind}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="bg-denim h-full transition-[width]"
                style={{ width: progress + "%" }}
              />
            </div>
          )}
        </>
      )}
      <p id={hintId} className="text-ink-muted mt-1.5 text-sm">
        {kind === "image"
          ? "JPEG, PNG or WebP, up to 5 MB."
          : "MP4, MOV or WebM, up to 100 MB."}
      </p>
      <p aria-live="polite" className="text-danger text-sm font-medium">
        {shownError}
      </p>
    </div>
  );
}
