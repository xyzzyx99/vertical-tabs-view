import { CreateHeader } from "./header.js";
import {
  CreateAndAppendTabsAsList,
  GetTabWrapperFromID,
  GetAllTabInfoWrappers,
  UnselectTabInfoWrapper,
  ToogleTabInfoWrapperSelected,
  GetTabIdFromTabWrapperElement,
} from "./tab_utils.js";
import { CloseAllTabsWithIds } from "./tab_actions.js";
import { FilterBasedOnSearchValue } from "./searchbar.js";
import { COLOR_SCHEMES } from "./colors.js";
import {
  getViewMode,
  getSortBy,
  setSortBy,
  getParentTabMap,
} from "./storage.js";

let LOCKED_INFO = {
  locked: 0,
  timestamp: Date.now(),
};

export async function LoadScheme() {
  const theme =
    (await chrome.storage.local.get("theme")).theme || "classic_mode";
  const backgroundColor = COLOR_SCHEMES[theme].backgroundColor;
  const titleColor = COLOR_SCHEMES[theme]?.titleColor || "";
  const urlTitleColor = COLOR_SCHEMES[theme]?.urlTitleColor || "";
  const updateAgoTextColor = COLOR_SCHEMES[theme]?.updateAgoTextColor || "";
  const primaryColor = COLOR_SCHEMES[theme].primaryColor;

  document.getElementById("body").style.backgroundColor = backgroundColor;
  document.getElementById("top-header").style.backgroundColor = backgroundColor;
  document.getElementById("create-new-tab-button").style.color = titleColor;
  document.getElementById("footer").style.backgroundColor = backgroundColor;
  document.getElementById("search-bar").style.backgroundColor = backgroundColor;
  document.getElementById("search-bar").style.color = titleColor;

  const viewMode = await getViewMode();
  const sortBy = await getSortBy();

  // Actions popup
  Array.from(document.getElementsByClassName("more-vert-header-popup")).forEach(
    (actionsPopup) => {
      actionsPopup.style.backgroundColor =
        theme === "dark_mode" ? "#555" : "#eee";
    },
  );
  Array.from(
    document.getElementsByClassName("more-vert-icon-item-wrapper"),
  ).forEach((actionPopupItem) => {
    actionPopupItem.style.color = theme === "dark_mode" ? "white" : "#333";
  });

  Array.from(document.getElementsByClassName("header-button")).forEach(
    (headerButton) => {
      if (headerButton.id === "treeHeader") {
        if (viewMode === "tree") {
          headerButton.style.setProperty("color", primaryColor);
        } else {
          headerButton.style.color = titleColor;
        }
      }
      if (headerButton.id === "activeHeader") {
        if (sortBy === "ACTIVE_ASC" || sortBy === "ACTIVE_DESC") {
          headerButton.style.setProperty("color", primaryColor);
        } else {
          headerButton.style.color = titleColor;
        }
      }
      if (headerButton.id === "groupSitesHeader") {
        headerButton.style.color = titleColor;
      }
      if (headerButton.id === "siteHeader") {
        if (sortBy === "SITE_ASC" || sortBy == "SITE_DESC") {
          headerButton.style.setProperty("color", primaryColor);
        } else {
          headerButton.style.color = titleColor;
        }
      }
    },
  );

  Array.from(document.getElementsByClassName("search-icon")).forEach((icon) => {
    icon.style.color = primaryColor;
  });
  Array.from(document.getElementsByClassName("more-vert-icon-header")).forEach(
    (icon) => {
      icon.style.color = primaryColor;
    },
  );
  Array.from(document.getElementsByClassName("headerIcon")).forEach((icon) => {
    if (icon.id === "treeHeaderIcon") {
      if (viewMode === "tree") {
        icon.style.setProperty("color", primaryColor);
      } else {
        icon.style.color = titleColor;
      }
    }
    if (icon.id === "activeHeaderIcon") {
      if (sortBy === "ACTIVE_ASC" || sortBy === "ACTIVE_DESC") {
        icon.style.setProperty("color", primaryColor);
      } else {
        icon.style.color = titleColor;
      }
    }
    if (icon.id === "groupSitesHeaderIcon") {
      icon.style.color = titleColor;
    }
    if (icon.id === "siteHeaderIcon") {
      if (sortBy === "SITE_ASC" || sortBy == "SITE_DESC") {
        icon.style.setProperty("color", primaryColor);
      } else {
        icon.style.color = titleColor;
      }
    }
  });

  Array.from(document.getElementsByClassName("vertical-dots-wrapper")).forEach(
    (dots) => {
      dots.style.color = titleColor;
    },
  );

  Array.from(
    document.getElementsByClassName("horizontal-dots-wrapper"),
  ).forEach((dots) => {
    dots.style.color = titleColor;
  });

  Array.from(document.getElementsByClassName("close-tab-icon")).forEach(
    (closeTabIcon) => {
      closeTabIcon.style.color = titleColor;
    },
  );
  Array.from(document.getElementsByClassName("tab-info-wrapper")).forEach(
    (tabInfoWrapper) => {
      tabInfoWrapper.classList.add(
        theme === "dark_mode"
          ? "tab-info-wrapper-dark-mode"
          : "tab-info-wrapper-white-mode",
      );
      tabInfoWrapper.classList.remove(
        theme !== "dark_mode"
          ? "tab-info-wrapper-dark-mode"
          : "tab-info-wrapper-white-mode",
      );

      // tabInfoWrapper.style.backgroundColor = tabWrapperColor;
    },
  );
  Array.from(
    document.getElementsByClassName("focused-tab-info-wrapper"),
  ).forEach((focusedTab, i) => {
    // if (i === 0)
    // focusedTab.style.backgroundColor = COLOR_SCHEMES[theme].focusTabColor;
  });
  Array.from(document.getElementsByClassName("url-title-text")).forEach(
    (urlTitle) => {
      urlTitle.style.color = urlTitleColor;
    },
  );
  Array.from(document.getElementsByClassName("updated-ago-text")).forEach(
    (updatedAgoText) => {
      updatedAgoText.style.color = updateAgoTextColor;
    },
  );
  Array.from(document.getElementsByClassName("more-vert-button")).forEach(
    (moreVertButton) => {
      moreVertButton.style.color = updateAgoTextColor;
    },
  );
  Array.from(document.getElementsByClassName("site-wrapper")).forEach(
    (siteWrapper) => {
      siteWrapper.style.backgroundColor =
        theme === "dark_mode" ? "#404040" : "#eee";
    },
  );
}

const AddTreeInfo = async (tabs) => {
  const tabIndexMap = {};
  tabs.forEach((tab, i) => (tabIndexMap[tab.id] = i));
  tabs.forEach((tab) => {
    const parentId = tab.openerTabId;
    if (parentId && tabIndexMap[tab.openerTabId] !== undefined) {
      const parentIndex = tabIndexMap[parentId];
      if (!tabs[parentIndex].children) {
        tabs[parentIndex].children = [tab.id];
      } else {
        tabs[parentIndex].children.push(tab.id);
      }
    }
  });
  return tabs;
};

function retrievedTabsMetadata() {
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.local.get(null, (items) => {
      // Pass any observed errors down the promise chain.
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(items);
    });
  });
}

const CreateTabsListCompare = (a, b, type) => {
  if (type == "ACTIVE_ASC") {
    return b.updatedAt - a.updatedAt;
  }
  if (type == "ACTIVE_DESC") {
    return a.updatedAt - b.updatedAt;
  }
  if (type == "TITLE_ASC") {
    return b.title.localeCompare(a.title);
  }
  if (type == "TITLE_DESC") {
    return a.title.localeCompare(b.title);
  }
  if (type == "SITE_ASC") {
    return b.site.localeCompare(a.site);
  }
  if (type == "SITE_DESC") {
    return a.site.localeCompare(b.site);
  }
};

const FocusonTabWithId = async (id, focus = true) => {
  let tab = GetTabWrapperFromID(id);
  if (!tab) {
    return;
  }
  // Unselect everything.
  for (let tabInfoWrapper of GetAllTabInfoWrappers()) {
    UnselectTabInfoWrapper(tabInfoWrapper);
  }
  ToogleTabInfoWrapperSelected(
    tab.getElementsByClassName("tab-info-wrapper")[0],
  );

  tab.scrollIntoViewIfNeeded({ block: "center", behavior: "instant" });
  if (focus) {
    document.getElementById("search-bar").focus();
  }
};

const sortTabsAndAddMetadata = async (sortBy) => {
  let tabs = await chrome.tabs.query({});
  const tabsMetadata = await retrievedTabsMetadata();
  let parentTabMap = await getParentTabMap();
  const tabIndexMap = {};
  tabs.forEach((tab, i) => (tabIndexMap[tab.id] = i));
  // TODO move to its own method.
  // If the tab does not even exist anymore, delete it from the tabsMetadata.
  for (const tabId in parentTabMap) {
    if (
      tabIndexMap[tabId] === undefined ||
      tabIndexMap[parentTabMap[tabId]] === undefined
    ) {
      delete parentTabMap[tabId];
    }
  }

  chrome.storage.local.set({ parentTabMap: parentTabMap }, function () {});

  let sortedTabs = tabs.map((tab) => {
    let site = tab?.url ? new URL(tab.url) : { hostname: "" };
    site = site.hostname.replace("www.", "");
    let openerTabId = parentTabMap
      ? parentTabMap[tab.id] || undefined
      : undefined;
    // Remove opener tab id if opener tab does not exist anymore.
    if (openerTabId && tabIndexMap[openerTabId] === undefined) {
      openerTabId = undefined;
    }
    const updatedAt = tabsMetadata[tab.id]
      ? tabsMetadata[tab.id].updatedAt
      : Date.now();
    return {
      ...tab,
      site,
      updatedAt,
      openerTabId,
    };
  });
  if (sortedTabs !== "NONE")
    sortedTabs.sort((a, b) => CreateTabsListCompare(a, b, sortBy));

  return sortedTabs;
};

const CreateTabsList = async () => {
  const now = Date.now();
  if (LOCKED_INFO.locked > 0 && now - LOCKED_INFO.timestamp < 3000) {
    // Locked, reschedule call.
    setTimeout(
      () => CreateTabsList(),
      3000 -
        (now - LOCKED_INFO.timestamp - 3000) +
        Math.floor(Math.random() * 10) * 50,
    );
    return;
  }
  const sortBy = await getSortBy();
  LOCKED_INFO.locked++;
  LOCKED_INFO.timestamp = now;
  let sortedTabs = await sortTabsAndAddMetadata(sortBy);
  sortedTabs = await AddTreeInfo(sortedTabs);
  let wrapper = document.getElementById("tabs-list");
  wrapper.innerHTML = "";
  await CreateAndAppendTabsAsList(
    sortedTabs,
    async () => {
      CreateTabsList();
    },
    wrapper,
  );

  FilterBasedOnSearchValue(document.getElementById("search-bar")?.value || "");
  CreateHeader(
    sortedTabs,
    (sortBy) => {
      setSortBy(sortBy);
    },
    async (ids) => {
      await CloseAllTabsWithIds(ids);
    },
  );
  LoadScheme();
  LOCKED_INFO.locked--;
};

const populateWithTabs = async () => {
  await CreateTabsList();
};

const onBodyClicked = (e) => {
  document.getElementById("search-bar").focus();
};

const addBodyEvents = () => {
  const body = document.getElementById("body");
  body.addEventListener("click", onBodyClicked);
};

document.getElementById("search-bar").focus();

populateWithTabs();
addBodyEvents();
LoadScheme();

// TODO: Move to tabs file
const UpdateTabOnly = async (tabId, updatedAt) => {
  if (!updatedAt) return;

  const tabElement = GetTabWrapperFromID(tabId);
  if (!tabElement) return;

  let tab = await chrome.tabs.get(parseInt(tabId));
  if (!tab) return;

  const updateAgoElement = document.getElementById("tab_updated_ago_" + tabId);
  const titleElement = document.getElementById("tab_title_" + tabId);
  const iconElement = document.getElementById("tab_icon_" + tabId);

  if (!updateAgoElement || !titleElement || !iconElement) return;

  titleElement.textContent = tab.title;
//  iconElement.src = tab.favIconUrl;
// correct no favicon
  iconElement.src = tab.favIconUrl || "./img/Chrome.webp"

  let updatedAgoMilisecondsAgo = Date.now() - tab.updatedAt;
  const updatedAgoSeconds = parseInt(updatedAgoMilisecondsAgo / 1000);
  const updatedAgoMinutes = parseInt(updatedAgoSeconds / 60);
  const updatedAgoHours = parseInt(updatedAgoMinutes / 60);
  const updatedAgoDays = parseInt(updatedAgoHours / 24);
  let updateAgo;
  if (updatedAgoDays > 0) updateAgo = updatedAgoDays + "d ago";
  else if (updatedAgoHours > 0) updateAgo = updatedAgoHours + "h ago";
  else if (updatedAgoMinutes > 0) updateAgo = updatedAgoMinutes + "m ago";
  else updateAgo = "1m ago";
  updateAgoElement.textContent = updateAgo;
};

chrome.storage.onChanged.addListener(async (changes, namespace) => {
  let deletionHandled = false;
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key === "sessionData" || key === "clientId" || key === "parentTabMap") {
      continue;
    }

    // this is null for some reason
    if (key === "lastCreateTabsListContext") {
      if (!newValue && oldValue) {
        setSortBy(oldValue.sortBy);
        await CreateTabsList();
        continue;
      }
      await CreateTabsList();
      continue;
    }
    if (key === "theme") {
      LoadScheme();
      continue;
    }
    async function getCurrentTab() {
      let queryOptions = { active: true, lastFocusedWindow: true };
      // `tab` will either be a `tabs.Tab` instance or `undefined`.
      let [tab] = await chrome.tabs.query(queryOptions);
      return tab;
    }
    if (!isNaN(key) && oldValue?.updatedAt && newValue?.updatedAt) {
      UpdateTabOnly(key, newValue.updatedAt);
      const currentTab = await getCurrentTab();
      if (currentTab) {
        FocusonTabWithId(currentTab.id);
      }
      continue;
    }
    if (!isNaN(key) && !oldValue && newValue?.updatedAt) {
      await CreateTabsList();
      const currentTab = await getCurrentTab();
      if (currentTab) {
        FocusonTabWithId(currentTab.id);
      }
      continue;
    }

    if (key === "viewMode") {
      await CreateTabsList();
      const currentTab = await getCurrentTab();
      if (currentTab) {
        FocusonTabWithId(currentTab.id);
      }
      continue;
    }

    if (!isNaN(key)) {
      // If deleted scroll to top.
      const deleted = !isNaN(key) && oldValue && !newValue;
      if (deleted && !deletionHandled) {
        const deletedTab = GetTabWrapperFromID(key);
        const sibling =
          deletedTab.nextElementSibling || deletedTab.previousElementSibling;
        await CreateTabsList();

        const siblingId = sibling.getAttribute("id").split("tab_wrapper_")[1];
        if (!sibling || (siblingId && key != parseInt(siblingId))) return;

        const idTabToFocus = GetTabIdFromTabWrapperElement(sibling);
        if (!idTabToFocus) return;
        const tabToFocus = GetTabWrapperFromID(idTabToFocus);
        if (!tabToFocus) return;

        tabToFocus.scrollIntoView({
          block: "center",
          behavior: "instant",
        });
        deletionHandled = true;
      }
    }
  }
});
