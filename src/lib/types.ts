export type Theme = "light" | "system" | "dark";
export type Language = "en" | "fr";

export type Profile = {
  id: string;
  full_name: string | null;
  pronouns: string | null;
  bio: string | null;
  avatar_url: string | null;
  accent_color: string;
  secondary_color: string;
  theme: Theme;
  username: string | null;
  instrument: string | null;
  experience_level: string | null;
  primary_goal: string | null;
  favorite_composers: string | null;
  practice_hours: number | null;
  target_practice_hours: number | null;
  practice_days: string[] | null;
  created_at: string;
  updated_at: string;
};

export type Session = {
  id: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  throughout_day?: boolean;
  estimated_minutes?: number | null;
  session_type: "practice" | "lesson";
  notes: string | null;
};

export type Piece = {
  id: string;
  title: string;
  composer: string | null;
  status: "want_to_learn" | "learning" | "polished";
  notes: string | null;
  musicbrainz_id?: string | null;
  source_url?: string | null;
  catalog?: string | null;
  era?: string | null;
};