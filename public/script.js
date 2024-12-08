function lookupLatestCookieSuccessTime(code) {
  const cookiePrefix = `last-successful-download-${code}=`;
  return document.cookie
    .split(";")
    .map((x) => x.trim())
    .filter((x) => x.startsWith(cookiePrefix))
    .map((x) => Number(x.substring(cookiePrefix.length)))
    .sort()
    .at(-1);
}

function cookieSuccessHasChanged(code, previousTime) {
  const latestTime = lookupLatestCookieSuccessTime(code);
  return latestTime > previousTime;
}

async function pollCookiesForSuccess(code, previousTime) {
  while (true) {
    if (cookieSuccessHasChanged(code, previousTime)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

const domWidgets = {
  downloadForm: ($elem, config) => {
    const $hideElem = document.getElementById(config.successHideId);
    if (!$hideElem) {
      console.error("No element found with id", config.successHideId);
      return;
    }
    $elem.addEventListener("submit", async () => {
      const previousTime = lookupLatestCookieSuccessTime(config.reportCode) ||
        0;
      await pollCookiesForSuccess(config.reportCode, previousTime);
      $hideElem.innerHTML = "";
      const $successElem = document.createElement("h2");
      $successElem.classList.add("display-4");
      $successElem.classList.add("mb-4");
      $successElem.innerText = "Your download has started.";
      const $pElem = document.createElement("p");
      $pElem.innerText = "Please check your downloads folder.";
      $hideElem.appendChild($successElem);
      $hideElem.appendChild($pElem);
    });
  },
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-dom-widget]").forEach(($elem) => {
    const widgetName = $elem.getAttribute("data-dom-widget");
    const dataAttrs = $elem.getAttributeNames().filter((x) =>
      x.startsWith("data-") && x !== "data-dom-widget"
    );
    const handler = domWidgets[widgetName];
    if (handler) {
      const config = dataAttrs.reduce((accumulator, attrName) => {
        const keyName = attrName
          .split("-")
          .slice(1)
          .map((value, index) =>
            index === 0 ? value : value.at(0).toUpperCase() + value.substring(1)
          )
          .join("");
        return Object.assign({}, accumulator, {
          [keyName]: $elem.getAttribute(attrName),
        });
      }, {});
      handler($elem, config);
    } else {
      console.error("No handler found for widget type", widgetName);
    }
  });
});
