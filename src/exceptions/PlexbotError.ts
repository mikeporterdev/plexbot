export default class PlexbotError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, PlexbotError.prototype);
  }
}
