import { ExternalLink, PlayCircle } from "lucide-react";
import { youTubeEmbedUrl, youTubeSearchUrl } from "../../recipe-book/youtube";
import type { RecipeViewModel } from "../view-model";

type RecipeVideoProps = {
  recipe: Pick<RecipeViewModel, "title" | "video">;
  headingId: string;
};

/** Embedded or uploaded video, plus a YouTube search link for every recipe. */
export function RecipeVideo({ recipe, headingId }: RecipeVideoProps) {
  const { video } = recipe;

  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="font-display flex items-center gap-2 text-2xl font-semibold"
      >
        <PlayCircle className="text-denim size-6" aria-hidden="true" />
        Watch how it&apos;s made
      </h3>

      {video.kind === "youtube" && (
        <div className="rounded-card bg-ink shadow-card mt-4 aspect-video overflow-hidden">
          <iframe
            src={youTubeEmbedUrl(video.youtubeId)}
            title={"Video: " + recipe.title}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="size-full"
          />
        </div>
      )}

      {video.kind === "upload" && (
        <video
          controls
          preload="metadata"
          playsInline
          src={video.src}
          className="rounded-card bg-ink shadow-card mt-4 aspect-video w-full"
        >
          Your browser can&apos;t play this video.
        </video>
      )}

      <a
        href={youTubeSearchUrl(recipe.title)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent-strong mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-1 font-semibold underline-offset-4 hover:underline"
      >
        {video.kind === "none"
          ? "Find videos of this dish on YouTube"
          : "More videos on YouTube"}
        <ExternalLink className="size-4" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </section>
  );
}
