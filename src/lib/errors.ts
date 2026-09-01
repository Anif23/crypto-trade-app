// Maps Supabase/Postgres function errors to friendly, non-technical messages.
// The server functions raise known condition names; everything else is generic.

const MESSAGES: Record<string, string> = {
  authentication_required: "Please sign in to continue.",
  invalid_quantity: "Enter a valid quantity greater than zero.",
  asset_not_found: "This coin is not available for trading right now.",
  insufficient_balance: "You don't have enough virtual cash for this trade.",
  insufficient_holdings: "You don't own enough of this coin to sell that amount.",
  profile_not_found: "Your account profile could not be found.",
  forbidden: "You don't have permission to do that.",
  cannot_disable_self: "You can't disable your own admin account.",
  user_not_found: "That user doesn't exist.",
};

export function friendlyError(message: string | undefined | null): string {
  if (!message) return "Something went wrong. Please try again.";
  const key = Object.keys(MESSAGES).find((k) => message.includes(k));
  if (key) return MESSAGES[key];
  if (/rate limit/i.test(message)) return "Too many requests. Please wait a moment.";
  if (/network|fetch|timeout/i.test(message)) return "Network issue — check your connection.";
  return "Something went wrong. Please try again.";
}
