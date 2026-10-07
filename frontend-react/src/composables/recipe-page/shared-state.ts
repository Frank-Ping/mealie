import type { UserOut } from "@/lib/api/types/user";
import { useNavigationWarning } from "@/composables/use-navigation-warning";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export enum PageMode {
  EDIT = "EDIT",
  VIEW = "VIEW",
  COOK = "COOK",
}

export enum EditorMode {
  JSON = "JSON",
  FORM = "FORM",
}

/**
 * PageState encapsulates the state of the recipe page the can be shared across components.
 * It allows and facilitates the complex state management of the recipe page where many components
 * need to share and communicate with each other and guarantee consistency.
 *
 * **Page Modes**
 *
 * are ComputedRefs so we can use a readonly reactive copy of the state of the page.
 */
interface PageState {
  slug: string /* WF4-REVIEW: was Ref */;
  imageKey: number /* WF4-REVIEW: was Ref */;

  pageMode: PageMode /* WF4-REVIEW: was ComputedRef */;
  editMode: EditorMode /* WF4-REVIEW: was ComputedRef */;

  /**
   * true is the page is in edit mode and the edit mode is in form mode.
   */
  isEditForm: boolean /* WF4-REVIEW: was ComputedRef */;
  /**
   * true is the page is in edit mode and the edit mode is in json mode.
   */
  isEditJSON: boolean /* WF4-REVIEW: was ComputedRef */;
  /**
   * true is the page is in view mode.
   */
  isEditMode: boolean /* WF4-REVIEW: was ComputedRef */;
  /**
   * true is the page is in cook mode.
   */
  isCookMode: boolean /* WF4-REVIEW: was ComputedRef */;
  /**
   * true if the recipe is currently being parsed.
   */
  isParsing: boolean /* WF4-REVIEW: was ComputedRef */;

  setMode: (v: PageMode) => void;
  setEditMode: (v: EditorMode) => void;
  toggleEditMode: () => void;
  toggleCookMode: () => void;
  toggleIsParsing: (v?: boolean) => void;
}

type PageRefs = ReturnType<typeof pageRefs>;

const memo: Record<string, PageRefs> = {};

function pageRefs(slug: string) {
  return {
    slugRef: ref(slug),
    pageModeRef: ref(PageMode.VIEW),
    editModeRef: ref(EditorMode.FORM),
    isParsingRef: ref(false),
    imageKey: ref(1),
  };
}

function pageState({ slugRef, pageModeRef, editModeRef, isParsingRef, imageKey }: PageRefs): PageState {
  const { activateNavigationWarning, deactivateNavigationWarning } = useNavigationWarning();

  const toggleEditMode = () => {
    if (editModeRef === EditorMode.FORM) {
      editModeRef = EditorMode.JSON;
      return;
    }
    editModeRef = EditorMode.FORM;
  };

  const toggleCookMode = () => {
    if (pageModeRef === PageMode.COOK) {
      pageModeRef = PageMode.VIEW;
      return;
    }
    pageModeRef = PageMode.COOK;
  };

  const toggleIsParsing = (v: boolean | null = null) => {
    if (v === null) {
      v = !isParsingRef;
    }

    isParsingRef = v;
  };

  const setEditMode = (v: EditorMode) => {
    editModeRef = v;
  };

  const setMode = (toMode: PageMode) => {
    const fromMode = pageModeRef;

    if (fromMode === PageMode.EDIT) {
      if (toMode === PageMode.VIEW) {
        setEditMode(EditorMode.FORM);
      }
      deactivateNavigationWarning();
    }
    else if (toMode === PageMode.EDIT) {
      activateNavigationWarning();
    }

    pageModeRef = toMode;
  };

  return {
    slug: slugRef,
    pageMode: computed(() => pageModeRef),
    editMode: computed(() => editModeRef),
    imageKey,

    toggleEditMode,
    setMode,
    setEditMode,
    toggleCookMode,
    toggleIsParsing,

    isEditForm: computed(() => {
      return pageModeRef === PageMode.EDIT && editModeRef === EditorMode.FORM;
    }),
    isEditJSON: computed(() => {
      return pageModeRef === PageMode.EDIT && editModeRef === EditorMode.JSON;
    }),
    isEditMode: computed(() => {
      return pageModeRef === PageMode.EDIT;
    }),
    isCookMode: computed(() => {
      return pageModeRef === PageMode.COOK;
    }),
    isParsing: computed(() => {
      return isParsingRef;
    }),
  };
}

/**
 * usePageState provides a common way to interact with shared state across the
 * RecipePage component.
 */
export function usePageState(slug: string): PageState {
  if (!memo[slug]) {
    memo[slug] = pageRefs(slug);
  }

  return pageState(memo[slug]);
}

export function clearPageState(slug: string) {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete memo[slug];
}

/**
 * usePageUser provides a wrapper around auth that provides a type-safe way to
 * access the UserOut type from the context. If no user is logged in then an empty
 * object with all properties set to their zero value is returned.
 */
export function usePageUser(): { user: UserOut } {
  const auth = useMealieAuth();

  if (!auth.user) {
    return {
      user: {
        id: "",
        group: "",
        groupId: "",
        groupSlug: "",
        household: "",
        householdId: "",
        householdSlug: "",
        cacheKey: "",
        email: "",
      },
    };
  }

  return { user: auth.user };
}
