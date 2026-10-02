<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Keep provisional event facts in `src/lib/event-config.ts` so public pages and demo controls share one source of truth; the event has no live backend yet.
- Keep the interactive 3D vault in a client-only scene and all public information in semantic DOM; this preserves accessibility and a usable fallback.
