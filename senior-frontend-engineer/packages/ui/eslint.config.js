import { createConfig } from '@todo-app/config/eslint';

export default createConfig({ forbid: ['users', 'todos', 'router', 'jotai'] });
