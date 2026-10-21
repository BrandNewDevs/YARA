# YARA
Yet another reminder application

A mobile reminder assistant for elderly people. Users talk or type to YARA in plain language, and an on-device open-weight Gemma model replies and manages their reminders. Nothing leaves the phone.

## Stack
- Expo (dev client) + React Native + TypeScript, Expo Router
- On-device Gemma inference (to be integrated)

## Development
```bash
pnpm install
pnpm web
pnpm exec tsc --noEmit   # typecheck
pnpm lint          # lint
```

## Run with the real Gemma model
The chat defaults to a mock. To use Gemma 4 served by Ollama on your machine:
```bash
ollama pull gemma4:e2b
pnpm install
EXPO_PUBLIC_ASSISTANT=server pnpm web            # browser, or:
EXPO_PUBLIC_ASSISTANT=server pnpm exec expo run:android --device <serial>   # phone
adb reverse tcp:11434 tcp:11434                  # phone reaches Ollama on the laptop
```
Other Ollama models: set `EXPO_PUBLIC_ASSISTANT_MODEL`, and `EXPO_PUBLIC_ASSISTANT_THINK=false` for models without thinking (gemma3).
Tasks and Memory are stored on the phone in SQLite (`src/domain/db.ts`).

```bash
pnpm test:domain   # timing tests
```
