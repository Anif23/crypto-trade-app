// Maps Supabase/Postgres function errors to friendly, non-technical messages.
// The server functions raise known condition names; everything else is generic.

const MESSAGES: Record<string, string> = {
  authentication_required: "Please sign in to continue.",
  must_be_signed_in: "Please sign in to continue.",
  signed_in_to_update: "Please sign in to continue.",
  invalid_quantity: "Enter a valid quantity greater than zero.",
  asset_not_found: "This coin is not available for trading right now.",
  insufficient_balance: "You don't have enough virtual cash for this trade.",
  insufficient_holdings: "You don't own enough of this coin to sell that amount.",
  profile_not_found: "Your account profile could not be found.",
  forbidden: "You don't have permission to do that.",
  cannot_disable_self: "You can't disable your own admin account.",
  user_not_found: "That user doesn't exist.",
  market_data_failed: "Market data is temporarily unavailable. Please try again.",
  market_data_unavailable: "Market data is temporarily unavailable. Please try again.",
  invalid_response: "The server returned an invalid response. Please try again.",
};

export function friendlyError(message: string | undefined | null): string {
  if (!message) return "Something went wrong. Please try again.";
  const key = message.toLowerCase().replace(/ /g, "_");
  return MESSAGES[key] ?? message;
}