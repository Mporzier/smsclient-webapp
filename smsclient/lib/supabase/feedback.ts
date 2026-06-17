import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedbackCategory } from "@/lib/types/feedback";

export async function submitUserFeedback(
  supabase: SupabaseClient,
  userId: string,
  args: {
    category: FeedbackCategory;
    message: string;
  },
): Promise<{ error: Error | null }> {
  const message = args.message.trim();
  if (!message) {
    return { error: new Error("Le message ne peut pas être vide.") };
  }

  const { error } = await supabase.from("user_feedback").insert({
    user_id: userId,
    category: args.category,
    message,
  });

  return { error: error ? new Error(error.message) : null };
}
