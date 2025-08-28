export interface IAccountAssociation {
  header: string;
  payload: string;
  signature: string;
}

export const accountAssociations: Record<string, IAccountAssociation> = {
  dev: {
    header:
      'eyJmaWQiOjM3NzM5MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDU5NDg3ZDIxOWRkMDc5NUFiZDM4YzU1MTVFMjdlNzQxOEViODExNkIifQ',
    payload: 'eyJkb21haW4iOiJwb3RsdWNrLWRldi52ZXJjZWwuYXBwIn0',
    signature:
      'MHhiYjExNTY2ZDhjY2E4YzNiZTgyNDM1Njk0ODYyMTc4ZTBlODA1M2Y5NjI4NzQxNmMxY2M4YTY0ZmE1NWZhNDY3MzY3MmY5N2Q1NWE1OTdlNmUyMTI5ZjI2MmY4MDc5MjQ0ZTg2NjNkMzViZWIyNDBhY2M3Yzc5YjUyMmVjNTc2MjFj',
  },
  prod: {
    header: "eyJmaWQiOjQxMjE3MCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDYyNkM1OEY1NDUwZTk3MEJEMWQ0ODdFNzU1YjQwQTQxNjYwNTMzMDkifQ",
    payload: "eyJkb21haW4iOiJwb3RsdWNrLmxvY2tlci5tb25leSJ9",
    signature: "MHg2MjY0NjRiOGVmMzhjNjE0NmY0ZGIyMjgzN2NhMDRjYjkwNDM2NjA1YjljYTk2NWE1NWViMTFhMjYyNDI0ZGE3N2VkYmQ5ZTVlYzY3YmZmODJkNmU0ODk2ZTgxZDFhZTA2N2I1NmU4OGZhYzZmNjMzMzE2MDBiY2M3N2U2Y2VkYjFi"
  }
};
