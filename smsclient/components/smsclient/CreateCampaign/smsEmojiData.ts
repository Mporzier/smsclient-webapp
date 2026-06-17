/** Emojis à fort impact pour SMS marketing (sélection rapide). */
export const SMS_MARKETING_QUICK_EMOJIS = [
  "🔥",
  "🎁",
  "⏰",
  "✨",
  "💰",
  "👉",
  "🎉",
  "⭐",
  "🚀",
  "✅",
  "🏷️",
  "💥",
] as const;

export type SmsEmojiCategory = {
  label: string;
  emojis: readonly string[];
};

export const SMS_EMOJI_CATEGORIES: SmsEmojiCategory[] = [
  {
    label: "Promotions",
    emojis: ["🔥", "🎁", "💰", "🏷️", "💥", "⚡", "🛍️", "🛒", "📦", "🆓", "💯", "🤑"],
  },
  {
    label: "Engagement",
    emojis: ["❤️", "😍", "🙏", "👍", "👏", "🤝", "💪", "😊", "🥳", "😉", "💬", "📲"],
  },
  {
    label: "Urgence & CTA",
    emojis: ["⏰", "📅", "⚠️", "🔔", "👉", "👇", "▶️", "📢", "❗", "‼️", "⌛", "🏃"],
  },
  {
    label: "Célébration",
    emojis: ["🎉", "✨", "⭐", "🌟", "🎊", "🥂", "🍾", "🏆", "🎯", "💫", "🎈", "🪩"],
  },
  {
    label: "Local & contact",
    emojis: ["📍", "🏪", "🏬", "☎️", "📞", "✉️", "🔗", "🌐", "🗓️", "🕐", "🚗", "🅿️"],
  },
];
