// Map a feature name to its documentation URL. Left empty until LuxoInbox
// publishes its own help center; surfaces that consume this hide the "learn
// more" affordance when a feature has no URL.
const FEATURE_HELP_URLS = {};

export function getHelpUrlForFeature(featureName) {
  return FEATURE_HELP_URLS[featureName];
}
