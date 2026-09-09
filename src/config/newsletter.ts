// Kit (formerly ConvertKit) newsletter settings.
// KIT_FORM_ID: Kit > Grow > Landing Pages & Forms > your form > the numeric id in its URL.
// KIT_PUBLIC_API_KEY: Kit > Settings > Developer > "API Key". This is the PUBLIC key,
// documented as safe for browser use. Never put the API Secret here.
// Both empty means the newsletter section does not render at all.
export const KIT_FORM_ID = '9900945';
export const KIT_PUBLIC_API_KEY = '_uJeMa-_AYZg25-vNi10vw';

export function isNewsletterEnabled(formId: string, apiKey: string): boolean {
  return formId.trim().length > 0 && apiKey.trim().length > 0;
}

export const NEWSLETTER_ENABLED = isNewsletterEnabled(KIT_FORM_ID, KIT_PUBLIC_API_KEY);
