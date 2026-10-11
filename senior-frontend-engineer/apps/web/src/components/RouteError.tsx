import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { isNetworkError } from '@todo-app/core';
import { Button } from '@todo-app/ui';
import { useEffect } from 'react';
import { PageHeading } from './PageHeading';

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  // Let failed queries refetch when the route loads again.
  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  const message = isNetworkError(error)
    ? 'Could not reach the server. Check your connection and try again.'
    : 'Something went wrong while loading this page.';

  return (
    <>
      <PageHeading>Something went wrong</PageHeading>
      <p role="alert" className="mt-2 text-slate-700">
        {message}
      </p>
      <Button className="mt-4" onClick={() => void router.invalidate()}>
        Try again
      </Button>
    </>
  );
}
