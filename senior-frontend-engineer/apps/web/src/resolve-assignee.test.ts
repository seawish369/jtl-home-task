import { describe, expect, it } from 'vitest';
import { resolveAssignee } from './resolve-assignee';

const validIds = new Set(['ada', 'grace', 'linus']);

describe('resolveAssignee', () => {
  it('uses the page user over the URL and the active user', () => {
    expect(resolveAssignee({ pageUserId: 'grace', urlAssigneeId: 'linus', activeUserId: 'ada', validIds })).toEqual({
      source: 'page',
      listAssigneeId: 'grace',
      formAssigneeId: 'grace',
    });
  });

  it('uses the URL over the active user', () => {
    expect(resolveAssignee({ urlAssigneeId: 'linus', activeUserId: 'ada', validIds })).toEqual({
      source: 'url',
      listAssigneeId: 'linus',
      formAssigneeId: 'linus',
    });
  });

  it('falls back to the active user when the page and the URL say nothing', () => {
    expect(resolveAssignee({ activeUserId: 'ada', validIds })).toEqual({
      source: 'active',
      listAssigneeId: 'ada',
      formAssigneeId: 'ada',
    });
  });

  it('resolves to nobody when nothing is set', () => {
    expect(resolveAssignee({ activeUserId: null, validIds })).toEqual({
      source: 'none',
      listAssigneeId: undefined,
      formAssigneeId: undefined,
    });
  });

  it('keeps an unknown URL ID for the list, does not preselect it, and does not fall back to the active user', () => {
    expect(resolveAssignee({ urlAssigneeId: 'bogus', activeUserId: 'ada', validIds })).toEqual({
      source: 'url',
      listAssigneeId: 'bogus',
      formAssigneeId: undefined,
    });
  });

  it('ignores an active user that no longer exists', () => {
    expect(resolveAssignee({ activeUserId: 'deleted', validIds })).toEqual({
      source: 'none',
      listAssigneeId: undefined,
      formAssigneeId: undefined,
    });
  });

  it('does not preselect a page user that is not in the list', () => {
    expect(resolveAssignee({ pageUserId: 'new-user', activeUserId: 'ada', validIds })).toEqual({
      source: 'page',
      listAssigneeId: 'new-user',
      formAssigneeId: undefined,
    });
  });
});
