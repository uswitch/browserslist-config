export interface RawRecord {
  Browser: string;
  "Browser Version": string;
  Users: string;
  Sessions: string;
  "Pages/Session": string;
  "Avg. Session Duration": string;
  "% New Sessions": string;
  "Bounce Rate": string;
}

export interface FormattedRecord {
  browser: string;
  "browser version": string;
  "browser major version": string;
  sessions: number;
}
