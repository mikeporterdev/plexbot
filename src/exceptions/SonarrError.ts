export default class SonarrError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, SonarrError.prototype);
  }
}
