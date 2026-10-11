import { fieldErrorsFromZod, isApiError } from '@todo-app/core';
import { Alert, Button, TextField } from '@todo-app/ui';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { createUserSchema, type User } from './schemas';
import { useCreateUser } from './use-create-user';

export type CreateUserFormProps = {
  /** Called with the saved user; the app decides what happens next (e.g. navigate). */
  onCreated: (user: User) => void;
};

function validate(username: string) {
  const result = createUserSchema.safeParse({ username });
  return result.success
    ? { data: result.data, error: undefined }
    : { data: undefined, error: fieldErrorsFromZod(result.error).username };
}

export function CreateUserForm({ onCreated }: CreateUserFormProps) {
  const createUser = useCreateUser();
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the field after the error has rendered, so it is announced with it.
  const [focusRequest, setFocusRequest] = useState(0);
  useEffect(() => {
    if (focusRequest > 0) inputRef.current?.focus();
  }, [focusRequest]);

  function showUsernameError(message: string) {
    setUsernameError(message);
    setFocusRequest((n) => n + 1);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setUsername(event.target.value);
    // Validate as you type only after the first submit, so errors clear as you fix them.
    if (hasSubmitted) setUsernameError(validate(event.target.value).error);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createUser.isPending) return;
    setHasSubmitted(true);
    setFormError(undefined);

    const { data, error } = validate(username);
    if (!data) {
      showUsernameError(error ?? 'Check the username.');
      return;
    }
    setUsernameError(undefined);

    createUser.mutate(data, {
      onSuccess: onCreated,
      onError: (err) => {
        const serverFieldError = isApiError(err) ? err.fieldErrors.username : undefined;
        if (serverFieldError) showUsernameError(serverFieldError);
        else setFormError(isApiError(err) ? err.message : 'Something went wrong. Please try again.');
      },
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {formError && <Alert>{formError}</Alert>}
      <TextField
        ref={inputRef}
        label="Username"
        name="username"
        hint="3–20 letters or numbers."
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={username}
        onChange={handleChange}
        error={usernameError}
      />
      {/* Stays enabled (and focusable) while saving; extra submits are ignored above. */}
      <Button type="submit" aria-disabled={createUser.isPending || undefined}>
        {createUser.isPending ? 'Creating…' : 'Create user'}
      </Button>
    </form>
  );
}
