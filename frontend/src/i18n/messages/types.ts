/** One UI string in every supported language. Keeping the three
 * translations side by side means a missing one is a type error, and a
 * reviewer can check a Hindi/Marathi line against its English source at a
 * glance. */
export interface Message {
  en: string;
  hi: string;
  mr: string;
}
