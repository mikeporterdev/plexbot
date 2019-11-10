import PlexbotError from './exceptions/PlexbotError';
import FuzzySet = require('fuzzyset.js');

export function findMatching<T>(t: T[], getFunc: (t: T) => string, searchTerm: string): T | undefined {
  const exactMatch = t.find(i => getFunc(i).toLowerCase() === searchTerm.toLowerCase());
  if (exactMatch) {
    return exactMatch;
  }

  const fuzzySet = FuzzySet(t.map(i => getFunc(i)));
  const closestMatches = fuzzySet.get(searchTerm);

  if (closestMatches) {
    // If the closest result is over 95% match, and no other close results are above that, just assume what the user wanted.
    if (closestMatches[0][0] > 0.85 && closestMatches[1][0] < 0.85) {
      return t.find(i => getFunc(i) === closestMatches[0][1]);
    }

    throw new PlexbotError(`Couldn't find item with name ${searchTerm}, did you mean ${closestMatches[0][1]}?`);
  }

  return undefined;
}
