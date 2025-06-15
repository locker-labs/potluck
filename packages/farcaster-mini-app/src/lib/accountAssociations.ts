export interface IAccountAssociation {
    header: string;
    payload: string;
    signature: string;
}

export const accountAssociations: Record<string, IAccountAssociation> = {
    dev: {
        header: "eyJmaWQiOjM3NzM5MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDU5NDg3ZDIxOWRkMDc5NUFiZDM4YzU1MTVFMjdlNzQxOEViODExNkIifQ",
        payload: "eyJkb21haW4iOiJwb3RsdWNrLWRldi52ZXJjZWwuYXBwIn0",
        signature: "MHhiYjExNTY2ZDhjY2E4YzNiZTgyNDM1Njk0ODYyMTc4ZTBlODA1M2Y5NjI4NzQxNmMxY2M4YTY0ZmE1NWZhNDY3MzY3MmY5N2Q1NWE1OTdlNmUyMTI5ZjI2MmY4MDc5MjQ0ZTg2NjNkMzViZWIyNDBhY2M3Yzc5YjUyMmVjNTc2MjFj"
    }
}; 