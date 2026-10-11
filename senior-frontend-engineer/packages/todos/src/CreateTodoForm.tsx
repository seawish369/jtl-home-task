import { fieldErrorsFromZod, isApiError } from '@todo-app/core';
import { Alert, Button, SelectField, TextField } from '@todo-app/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createTodoSchema, type AssigneeOption, type CreateTodoInput, type Todo } from './schemas';
import { useCreateTodo } from './use-create-todo';

type Field = keyof CreateTodoInput;
type FieldErrors = Partial<Record<Field, string>>;
/** `id` is the failure's arrival number (1, 2, 3…), used to decide what a success may clear. */
type Failure = { id: number; title: string; message: string };
const FIELD_ORDER: Field[] = ['title', 'assigneeId'];

export type CreateTodoFormProps = {
  /** Who can be assigned; the app maps its users to { id, label }. */
  assigneeOptions: AssigneeOption[];
  /** Preselected assignee (e.g. the page's user). */
  defaultAssigneeId?: string;
  onCreated?: (todo: Todo) => void;
};

function validate(values: { title: string; assigneeId: string }) {
  const result = createTodoSchema.safeParse(values);
  return result.success
    ? { data: result.data, errors: {} as FieldErrors }
    : { data: undefined, errors: fieldErrorsFromZod(result.error) as FieldErrors };
}

const firstInvalid = (errors: FieldErrors) => FIELD_ORDER.find((field) => errors[field]);

function failureMessage(error: unknown): string {
  if (!isApiError(error)) return 'Something went wrong.';
  const fieldMessages = Object.values(error.fieldErrors);
  return fieldMessages.length > 0 ? fieldMessages.join(' ') : error.message;
}

export function CreateTodoForm({ assigneeOptions, defaultAssigneeId = '', onCreated }: CreateTodoFormProps) {
  const createTodo = useCreateTodo();
  const [title, setTitle] = useState('');
  // Only preselect an assignee that is actually an option (e.g. not ?assigneeId=bogus).
  const [assigneeId, setAssigneeId] = useState(() =>
    assigneeOptions.some((option) => option.id === defaultAssigneeId) ? defaultAssigneeId : '',
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failures, setFailures] = useState<Failure[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  // For errors on a field that already has focus: focusing it again is a no-op, so its
  // new description would never be read. The key forces a fresh node, so repeating the
  // same message is announced again.
  const [errorAnnouncement, setErrorAnnouncement] = useState({ text: '', count: 0 });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const assigneeRef = useRef<HTMLSelectElement>(null);

  // Failures are numbered as they arrive. A successful submission clears only the
  // failures that were already on screen when it was submitted, never ones that
  // arrive while it is in flight (e.g. "please fail" then "Second ok" right after).
  const failureCount = useRef(0);

  // Results can arrive after the form unmounted (e.g. the user navigated away).
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Focus after the error has rendered, so it is announced with the field.
  const [focusRequest, setFocusRequest] = useState<{ field: Field } | null>(null);
  useEffect(() => {
    if (!focusRequest) return;
    (focusRequest.field === 'title' ? titleRef : assigneeRef).current?.focus();
  }, [focusRequest]);

  const labelFor = (id: string) => assigneeOptions.find((option) => option.id === id)?.label ?? 'the selected user';

  function update(next: { title: string; assigneeId: string }) {
    setTitle(next.title);
    setAssigneeId(next.assigneeId);
    // Validate as you type only after a failed submit, so errors clear as you fix them.
    if (hasSubmitted) setErrors(validate(next).errors);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);

    const { data, errors: clientErrors } = validate({ title, assigneeId });
    if (!data) {
      setErrors(clientErrors);
      const field = firstInvalid(clientErrors);
      const target = (field === 'title' ? titleRef : assigneeRef).current;
      if (field && target === document.activeElement) {
        const messages = FIELD_ORDER.flatMap((name) => clientErrors[name] ?? []);
        setErrorAnnouncement((current) => ({ text: messages.join(' '), count: current.count + 1 }));
      } else if (field) {
        setFocusRequest({ field });
      }
      return;
    }

    // Optimistic: the item is already in the list, so the form is ready for the next one.
    // A double submit is harmless: the title is empty now and fails validation.
    const failuresSeenAtSubmit = failureCount.current;
    const label = labelFor(data.assigneeId);
    setErrors({});
    setHasSubmitted(false);
    setTitle('');
    setStatusMessage(`Saving “${data.title}” for ${label}…`);
    setFocusRequest({ field: 'title' });

    // mutateAsync, not mutate: mutate's per-call callbacks only fire for the latest call,
    // so with two quick creates the first one's failure would be lost.
    createTodo
      .mutateAsync(data)
      .then((todo) => {
        if (!mounted.current) return;
        setStatusMessage(`Added “${todo.title}” for ${label}.`);
        setFailures((current) => current.filter((failure) => failure.id > failuresSeenAtSubmit));
        onCreated?.(todo);
      })
      .catch((error: unknown) => {
        // The hook has already rolled the list back; only the form's own state is left.
        if (!mounted.current) return;
        const id = ++failureCount.current;
        setStatusMessage('');
        // Give the title back, but never overwrite something new the user typed.
        setTitle((current) => (current === '' ? data.title : current));
        setFailures((current) => [...current, { id, title: data.title, message: failureMessage(error) }]);
      });
  }

  function dismissFailures() {
    setFailures([]);
    setFocusRequest({ field: 'title' }); // the focused Dismiss button is about to disappear
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {failures.length > 0 && (
        <div className="space-y-2">
          <Alert>
            <p className="font-medium">
              {failures.length === 1 ? 'This todo could not be saved:' : 'These todos could not be saved:'}
            </p>
            <ul className="mt-1 list-disc pl-5">
              {failures.map((failure) => (
                <li key={failure.id}>
                  “{failure.title}”: {failure.message}
                </li>
              ))}
            </ul>
          </Alert>
          {/* Outside the alert, so the announcement doesn't end with "Dismiss". */}
          <Button variant="secondary" onClick={dismissFailures}>
            Dismiss
          </Button>
        </div>
      )}
      <TextField
        ref={titleRef}
        label="Title"
        name="title"
        hint="Up to 120 characters."
        autoComplete="off"
        value={title}
        onChange={(event) => update({ title: event.target.value, assigneeId })}
        error={errors.title}
      />
      <SelectField
        ref={assigneeRef}
        label="Assignee"
        name="assigneeId"
        value={assigneeId}
        onChange={(event) => update({ title, assigneeId: event.target.value })}
        error={errors.assigneeId}
      >
        <option value="">Choose a user</option>
        {assigneeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit">Add todo</Button>
        {/* Always rendered so screen readers pick up changes to it. */}
        <p role="status" className="text-sm text-slate-700">
          {statusMessage}
        </p>
      </div>
      <p aria-live="assertive" className="sr-only">
        <span key={errorAnnouncement.count}>{errorAnnouncement.text}</span>
      </p>
    </form>
  );
}
