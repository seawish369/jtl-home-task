export type AssigneeSource = 'page' | 'url' | 'active' | 'none';

export type ResolvedAssignee = {
  source: AssigneeSource;
  /** Whose todos to show. A URL value wins even if unknown, so the list can say "no user with this ID". */
  listAssigneeId: string | undefined;
  /** Preselected in the create form: only a user that exists. */
  formAssigneeId: string | undefined;
};

type ResolveAssigneeInput = {
  pageUserId?: string;
  urlAssigneeId?: string;
  activeUserId?: string | null;
  validIds: ReadonlySet<string>;
};

/**
 * Who the todos on a page are for. Precedence: page context > URL > active user > nobody.
 * The URL decides what you're looking at; the active user is only a default for when
 * the page and the URL say nothing.
 */
export function resolveAssignee({ pageUserId, urlAssigneeId, activeUserId, validIds }: ResolveAssigneeInput): ResolvedAssignee {
  let source: AssigneeSource = 'none';
  let listAssigneeId: string | undefined;

  if (pageUserId) {
    source = 'page';
    listAssigneeId = pageUserId;
  } else if (urlAssigneeId) {
    source = 'url';
    listAssigneeId = urlAssigneeId; // no fallback to the active user, even if unknown
  } else if (activeUserId && validIds.has(activeUserId)) {
    source = 'active';
    listAssigneeId = activeUserId;
  }

  const formAssigneeId = listAssigneeId !== undefined && validIds.has(listAssigneeId) ? listAssigneeId : undefined;
  return { source, listAssigneeId, formAssigneeId };
}
