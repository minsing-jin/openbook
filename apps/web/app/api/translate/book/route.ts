import { type AIProvider, type DocumentSnapshot } from "@openbook/core";
import { requestProviderText } from "../../../../lib/provider-text";

export const runtime = "nodejs";

async function translateText(input: {
  provider?: AIProvider;
  apiKey: string;
  model?: string;
  sourceText: string;
  contextLabel: string;
  cache: Map<string, string>;
}): Promise<string> {
  const trimmed = input.sourceText.trim();
  if (!trimmed) {
    return input.sourceText;
  }

  const cached = input.cache.get(trimmed);
  if (cached) {
    return cached;
  }

  const translated = await requestProviderText({
    provider: input.provider,
    apiKey: input.apiKey,
    model: input.model,
    prompt: [
      "Translate the following book text into natural Korean.",
      "Rules:",
      "- Preserve the meaning faithfully.",
      "- Do not summarize or explain.",
      "- Preserve paragraph breaks when present.",
      "- Return only the Korean translation.",
      `Context: ${input.contextLabel}`,
      "",
      trimmed
    ].join("\n")
  });

  input.cache.set(trimmed, translated);
  return translated;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    snapshot?: DocumentSnapshot;
    provider?: AIProvider;
    apiKey?: string;
    model?: string;
    targetLanguage?: string;
  };

  if (!body.snapshot || !body.apiKey) {
    return Response.json({ error: "Missing snapshot or API key" }, { status: 400 });
  }

  if ((body.targetLanguage ?? "ko") !== "ko") {
    return Response.json({ error: "Only Korean translation is supported right now" }, { status: 400 });
  }

  try {
    const snapshot = body.snapshot;
    const cache = new Map<string, string>();

    const translatedTitle = await translateText({
      provider: body.provider,
      apiKey: body.apiKey,
      model: body.model,
      sourceText: snapshot.title,
      contextLabel: "Book title",
      cache
    });

    const translatedBlocks = [];
    for (const block of snapshot.blocks) {
      const translatedText = await translateText({
        provider: body.provider,
        apiKey: body.apiKey,
        model: body.model,
        sourceText: block.text,
        contextLabel: `Book block (${block.type})`,
        cache
      });

      translatedBlocks.push({
        ...block,
        text: translatedText,
        html: block.html ? translatedText.replace(/\n/g, "<br />") : block.html
      });
    }

    const translatedBlockMap = new Map(translatedBlocks.map((block) => [block.id, block.text]));

    const translatedChapters = snapshot.chapters.map((chapter) => {
      const headingBlock = snapshot.blocks.find(
        (block) => block.chapterId === chapter.id && block.type === "heading"
      );
      return {
        ...chapter,
        title: headingBlock ? translatedBlockMap.get(headingBlock.id) ?? chapter.title : chapter.title
      };
    });

    const translatedToc = snapshot.toc.map((entry) => ({
      ...entry,
      label: translatedBlockMap.get(entry.blockId) ?? entry.label
    }));

    const translatedSnapshot: DocumentSnapshot = {
      ...snapshot,
      title: translatedTitle,
      language: "ko",
      chapters: translatedChapters,
      toc: translatedToc,
      blocks: translatedBlocks,
      fullText: translatedBlocks.map((block) => block.text).join("\n\n")
    };

    return Response.json({ translatedSnapshot });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Translation failed" },
      { status: 500 }
    );
  }
}
