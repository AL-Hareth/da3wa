import "server-only";
import { hmac } from "./request";

export const rsvpCookieName = (eventId: string) => `rsvp_${eventId}`;
export const pinCookieName = (eventId: string) => `pin_${eventId}`;

/** Bound to the current PIN, so changing the PIN revokes previously unlocked visitors. */
export const pinCookieValue = (eventId: string, pin: string) => hmac(`pin:${eventId}:${pin}`);
