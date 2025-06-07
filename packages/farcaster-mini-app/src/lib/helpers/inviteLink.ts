export function getInviteLink(potId: bigint): string {
    return `${window.location.origin}/pot/${potId}?join`;
}