export const getTracker = (...props) => {
  if (!window?.Matomo) return null;
  return window.Matomo.getAsyncTracker(...props);
};

const usernameToHex = (username) => username.substr(3).padStart(16, '0');

export const pageView = (
  url,
  title,
  { username, clientId, emailAddress } = {},
) => {
  const tracker = getTracker();
  if (tracker) {
    if (emailAddress || username) {
      tracker.setVisitorId(usernameToHex(emailAddress || username));
    }
    if (clientId) {
      tracker.setUserId(clientId);
    }
    tracker.setCustomUrl(url);
    tracker.setDocumentTitle(title);
    tracker.trackPageView();
  }
};

export const setECommerceView = (
  productSKU,
  productName,
  categoryName,
  price,
) => {
  const tracker = getTracker();
  if (tracker) {
    if (productSKU) {
      tracker.setEcommerceView(
        productSKU,
        productName,
        categoryName,
        price ?? 0 / 100,
      );
      tracker.trackPageView();
    }
  }
};

export const trackSiteSearch = (
  keyword,
  { username, clientId } = {},
  resultCount = 0,
) => {
  const tracker = getTracker();
  if (tracker) {
    if (keyword) {
      if (username) {
        tracker.setVisitorId(usernameToHex(username));
      }
      if (clientId) {
        tracker.setUserId(clientId);
      }
      tracker.trackSiteSearch(keyword, false, resultCount);
      tracker.trackPageView();
    }
  }
};

export const trackEvent = (category, action, name, value) => {
  const tracker = getTracker();
  if (tracker) {
    if (category && action) {
      tracker.trackEvent(category, action, name, value);
      tracker.trackPageView();
    }
  }
};

export default getTracker;
