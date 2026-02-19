import { SelectionCriteria } from "../types";
import { STATIC_RULES } from "../data/rules";

/**
 * Fetches a rule for the oracle from the local database.
 * No API key or internet connection required.
 */
export const fetchCreativeCriteria = async (isGeneralRule: boolean = false): Promise<SelectionCriteria> => {
  // Artificial delay to maintain the "Thinking" suspense
  await new Promise(resolve => setTimeout(resolve, 800));

  const randomIndex = Math.floor(Math.random() * STATIC_RULES.length);
  return STATIC_RULES[randomIndex];
};
