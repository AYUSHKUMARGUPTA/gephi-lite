import { FC, PropsWithChildren, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useKonami from "react-use-konami";

import { extractFilename } from "../utils/url";
import { AuthInit } from "./user/AuthInit";
import { useNotifications } from "./notifications";
import { graphDatasetAtom } from "./graph";
import { parseDataset, getEmptyGraphDataset } from "./graph/utils";
import { filtersAtom } from "./filters";
import { parseFiltersState } from "./filters/utils";
import { appearanceAtom } from "./appearance";
import { parseAppearanceState } from "./appearance/utils";
import { preferencesAtom } from "./preferences";
import { getCurrentPreferences } from "./preferences/utils";
import { sessionAtom } from "./session";
import { parseSession, getEmptySession } from "./session/utils";
import { useModal } from "./modals";
import { WelcomeModal } from "../views/graphPage/modals/WelcomeModal";
import { resetCamera } from "./sigma";
import { I18n } from "../locales/provider";
import { useFileActions } from "./context/dataContexts";
import { fileStateAtom } from "./graph/files";

export const Initialize: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const { openModal } = useModal();
  const { openRemoteFile } = useFileActions();

  useKonami(
    () => {
      notify({
        type: "warning",
        title: "Warning",
        message: "java.lang.RuntimeException: java.lang.NullPointerException",
      });
    },
    {
      code: [
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "b",
        "a",
      ],
    },
  );

  /**
   * Initialize the application by loading data from
   * - url
   * - local storage
   * - ...
   */
  const initialize = useCallback(async () => {
    // Load session from local storage
    sessionAtom.set(() => {
      const raw = sessionStorage.getItem("session");
      const parsed = raw ? parseSession(raw) : null;
      return parsed ?? getEmptySession();
    });

    // Load preferences from local storage
    preferencesAtom.set(getCurrentPreferences());

    // Load a graph
    // ~~~~~~~~~~~~
    let graphFound = false;
    let showWelcomeModal = true;
    const url = new URL(window.location.href);

    // If query params has new
    // => empty graph & open welcome modal
    if (url.searchParams.has("new")) {
      graphDatasetAtom.set(getEmptyGraphDataset());
      graphFound = true;
      url.searchParams.delete("new");
      window.history.pushState({}, "", url);
    }

    // If query params has gexf
    // => try to load the file
    const isIdle = fileStateAtom.get().type === "idle";
    if (!graphFound && url.searchParams.has("gexf") && isIdle) {
      const gexfUrl = url.searchParams.get("gexf") || "";
      try {
        await openRemoteFile({
          type: "remote",
          filename: extractFilename(gexfUrl),
          url: gexfUrl,
        });
        graphFound = true;
        showWelcomeModal = false;
        // remove param in url
        url.searchParams.delete("gexf");
        window.history.pushState({}, "", url);
      } catch (e) {
        console.error(e);
        notify({
          type: "error",
          message: t("graph.open.remote.error") as string,
          title: t("gephi-lite.title") as string,
        });
      }
    }

    if (!graphFound) {
      // Load data from session storage
      const rawDataset = sessionStorage.getItem("dataset");
      const rawFilters = sessionStorage.getItem("filters");
      const rawAppearance = sessionStorage.getItem("appearance");

      if (rawDataset) {
        const dataset = parseDataset(rawDataset);

        if (dataset) {
          const appearance = rawAppearance ? parseAppearanceState(rawAppearance) : null;
          const filters = rawFilters ? parseFiltersState(rawFilters) : null;

          graphDatasetAtom.set(dataset);
          filtersAtom.set((prev) => filters || prev);
          appearanceAtom.set((prev) => appearance || prev);
          resetCamera({ forceRefresh: true });

          graphFound = true;
          if (dataset.fullGraph.order > 0) showWelcomeModal = false;
        }
      }
    }

    if (showWelcomeModal)
      openModal({
        component: WelcomeModal,
        arguments: {},
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * When application is loaded
   * => run the initialize function
   */
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <I18n>
      <AuthInit />
      {children}
    </I18n>
  );
};
