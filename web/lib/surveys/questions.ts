export type SurveyQuestionType = "multiple_choice" | "text";

export type SurveyQuestion = {
  id: string;
  prompt: string;
  type: SurveyQuestionType;
  required: boolean;
  options?: string[];
};

function normalizeQuestionId(value: string, fallbackIndex: number): string {
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return cleaned || `q_${fallbackIndex + 1}`;
}

export function sanitizeSurveyQuestions(input: unknown): SurveyQuestion[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set<string>();
  const result: SurveyQuestion[] = [];

  for (let i = 0; i < input.length; i += 1) {
    const item = input[i];
    if (!item || typeof item !== "object") {
      continue;
    }

    const raw = item as Record<string, unknown>;
    const prompt = typeof raw.prompt === "string" ? raw.prompt.trim() : "";
    if (!prompt) {
      continue;
    }

    const type: SurveyQuestionType =
      raw.type === "text" ? "text" : "multiple_choice";
    const required = raw.required !== false;
    const id = normalizeQuestionId(
      typeof raw.id === "string" ? raw.id : "",
      i
    );
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    if (type === "multiple_choice") {
      const options = Array.isArray(raw.options)
        ? raw.options
            .filter((option): option is string => typeof option === "string")
            .map((option) => option.trim())
            .filter(Boolean)
        : [];
      if (options.length < 2) {
        continue;
      }
      result.push({ id, prompt, type, required, options });
      continue;
    }

    result.push({ id, prompt, type, required });
  }

  return result;
}
