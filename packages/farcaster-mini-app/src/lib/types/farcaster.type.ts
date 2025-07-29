export type TAccountLocation = {
  placeId: string;

  /**
   * Human-readable string describing the location
   */
  description: string;
};

export type TUserContext = {
  fid: number;
  username?: string;
  displayName?: string;

  /**
   * Profile image URL
   */
  pfpUrl?: string;
  location?: TAccountLocation;
};

export interface TFarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
}