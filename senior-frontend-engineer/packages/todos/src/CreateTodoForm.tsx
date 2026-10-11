import { fieldErrorsFromZod, isApiError } from '@todo-app/core';
import { Alert, Button, SelectField, TextField } from '@todo-app/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createTodoSchema, type AssigneeOption, type CreateTodoInput, type Todo } from './schemas';
import { useCreateTodo } from './use-create-todo';

type Field = keyof CreateTodoInput;
type FieldErrors = Partial<Record<Field, string>>;
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

export function CreateTodoForm({ assigneeOptions, defaultAssigneeId = '', onCreated }: CreateTodoFormProps) {
  const createTodo = useCreateTodo();
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [statusMessage, setStatusMessage] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const assigneeRef = useRef<HTMLSelectElement>(null);

  // Focus after the error has rendered, so it is announced with the field.
  const [focusRequest, setFocusRequest] = useState<{ field: Field } | null>(null);
  useEffect(() => {
    if (!focusRequest) return;
    (focusRequest.field === 'title' ? titleRef : assigneeRef).current?.focus();
  }, [focusRequest]);

  function showErrors(next: FieldErrors) {
    setErrors(next);
    const field = firstInvalid(next);
    if (field) setFocusRequest({ field });
  }

  function update(next: { title: string; assigneeId: string }) {
    setTitle(next.title);
    setAssigneeId(next.assigneeId);
    // Validate as you type only after the first submit, so errors clear as you fix them.
    if (hasSubmitted) setErrors(validate(next).errors);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createTodo.isPending) return;
    setHasSubmitted(true);
    setFormError(undefined);
    setStatusMessage('');

    const { data, errors: clientErrors } = validate({ title, assigneeId });
    if (!data) {
      showErrors(clientErrors);
      return;
    }
    setErrors({});

    createTodo.mutate(data, {
      onSuccess: (todo) => {
        const label = assigneeOptions.find((option) => option.id === todo.assigneeId)?.label ?? 'the selected user';
        setTitle('');
        setHasSubmitted(false);
        setStatusMessage(`Added “${todo.title}” for ${label}.`);
        setFocusRequest({ field: 'title' });
        onCreated?.(todo);
      },
      onError: (error) => {
        const serverErrors: FieldErrors = isApiError(error)
          ? { title: error.fieldErrors.title, assigneeId: error.fieldErrors.assigneeId }
          : {};
        if (firstInvalid(serverErrors)) showErrors(serverErrors);
        else setFormError(isApiError(error) ? error.message : 'Something went wrong. Please try again.');
      },
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {formError && <Alert>{formError}</Alert>}
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
        {/* Stays enabled (and focusable) while saving; extra submits are ignored above. */}
        <Button type="submit" aria-disabled={createTodo.isPending || undefined}>
          {createTodo.isPending ? 'Adding…' : 'Add todo'}
        </Button>
        {/* Always rendered so screen readers pick up changes to it. */}
        <p role="status" className="text-sm text-green-800">
          {statusMessage}
        </p>
      </div>
    </form>
  );
}
