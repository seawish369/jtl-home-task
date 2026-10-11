Switched from render slot to assigneeOptions after AI review: same decoupling, less plumbing

Second plan review. Pushed back on client UUIDs, file-based routes and its
version guesses (MSW 2 / ESLint 9). Accepted assigneeOptions instead of a slot.
AI said "replace rather than refetch" — clarified: swap in place AND refetch
when the last create settles.
