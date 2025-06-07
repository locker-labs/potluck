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