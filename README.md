# YARA
Yet another reminder application

A mobile reminder assistant for elderly people. Users talk or type to YARA in plain language, and an on-device open-weight Gemma model replies and manages their reminders. Nothing leaves the phone.

## Stack
- Expo (dev client) + React Native + TypeScript, Expo Router
- On-device Gemma inference (to be integrated)

## Development
```bash
npm install
npx expo start
npx tsc --noEmit   # typecheck
npx expo lint      # lint
```
