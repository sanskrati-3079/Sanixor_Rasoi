import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { Clock, PlayCircle, Sparkles, UserRound, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cardClasses } from "@/components/ui/card";
import { DietBadge } from "@/components/ui/diet-badge";
import {
  difficultyLabels,
  emojiForRecipe,
  languageTag,
} from "../../recipes/display";
import type { BookRecipeSummary } from "../schemas";

const artTints = ["bg-sky", "bg-oak", "bg-sky-deep/60"];

export function SourceLabel({
  source,
  author,
}: Pick<BookRecipeSummary, "source" | "author">) {
  if (source === "kitchen") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Utensils className="text-denim size-3.5" aria-hidden="true" />
        From the Sanixor kitchen
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      {source === "ai" ? (
        <Sparkles className="text-denim size-3.5" aria-hidden="true" />
      ) : (
        <UserRound className="text-denim size-3.5" aria-hidden="true" />
      )}
      {source === "ai" ? "AI recipe saved by " : "By "}@
      {author ?? "former member"}
    </span>
  );
}

export function BookRecipeCard({
  recipe,
  index,
}: {
  recipe: BookRecipeSummary;
  index: number;
}) {
  const lang = languageTag(recipe.language);

  return (
    <article
      className={cardClasses({
        interactive: true,
        padded: false,
        className: "flex h-full flex-col overflow-hidden",
      })}
    >
      <div
        className={clsx(
          "relative grid h-40 place-items-center",
          artTints[index % artTints.length],
        )}
      >
        {recipe.photo ? (
          <Image
            src={recipe.photo.src}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span
            className="bg-surface/80 shadow-card grid size-24 place-items-center rounded-full text-5xl"
            aria-hidden="true"
          >
            {emojiForRecipe(recipe.title)}
          </span>
        )}
        {recipe.hasVideo && (
          <Badge
            tone="neutral"
            className="bg-surface absolute top-3 right-3"
            icon={
              <PlayCircle className="text-denim size-3.5" aria-hidden="true" />
            }
          >
            Video
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-ink-muted text-xs font-semibold">
          <SourceLabel source={recipe.source} author={recipe.author} />
        </p>
        <h3
          lang={lang}
          className="font-display mt-1.5 text-xl leading-snug font-semibold"
        >
          <Link
            href={"/book/" + recipe.id}
            className="after:rounded-card after:absolute after:inset-0 focus:outline-none"
          >
            {recipe.title}
          </Link>
        </h3>
        <p
          lang={lang}
          className="text-ink-muted mt-2 line-clamp-2 text-[0.95rem]"
        >
          {recipe.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <Badge
            tone="accent"
            icon={<Clock className="size-3.5" aria-hidden="true" />}
          >
            {recipe.totalTimeMinutes} min
          </Badge>
          <Badge tone="neutral">{difficultyLabels[recipe.difficulty]}</Badge>
          <DietBadge diet={recipe.diet} />
        </div>
      </div>
    </article>
  );
}
