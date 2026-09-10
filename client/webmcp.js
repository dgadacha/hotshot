export function registerGameTools(actions) {
  const context = document.modelContext;
  if (!context?.registerTool) return () => {};
  const lifecycle = new AbortController();
  const validate = (input) => {
    if (
      !input ||
      typeof input !== 'object' ||
      Array.isArray(input) ||
      Object.keys(input).length
    )
      throw new Error('This tool expects an empty object.');
  };
  const tools = [
    {
      name: 'get_hotshot_status',
      title: 'Read HOTSHOT match status',
      description:
        'Read the current mode, health, weapon, score and match phase.',
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        validate(input);
        return actions.status();
      },
    },
    {
      name: 'start_hotshot_practice',
      title: 'Start HOTSHOT practice',
      description:
        'Start a new practice duel against the bot. The player clicks Reprendre to capture the mouse when required by the browser. Fails if a duel is already active.',
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        validate(input);
        if (actions.status().mode !== 'menu')
          throw new Error('Leave the current duel before starting another.');
        await actions.practice();
        return actions.status();
      },
    },
  ];
  for (const tool of tools) {
    try {
      Promise.resolve(
        context.registerTool(
          {
            ...tool,
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Optional browser capability; gameplay remains available. */
    }
  }
  return () => lifecycle.abort();
}
