import type { ParsedUrlQuery } from "querystring";
export interface WSData {
  query: ParsedUrlQuery;
  reject?: any[];
  accept?: any[];
  limit?: number;
  accurate?: boolean;
  saveData?: boolean;
  id: string;
  authorized: boolean;
  pubkey: string;
  host: string;
}
