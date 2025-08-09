export interface FUser {
  fid: number;
  username: string;
  display_name: string;
  pfpUrl?: string;
  // custody_address: string;
}

export interface BulkUsersByAddressResponse {
  [address: string]: FUser[];
}
