import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import actionSchema from '../../ml/action.schema.json';
import onboardingSchema from '../../ml/onboard.schema.json';
import reminderSchema from '../../ml/reminder_texts.schema.json';
import type { ReminderTexts } from '@/domain/types';
import type { AssistantReply, OnboardingResult } from './types';

export const schemas = {
  chat: actionSchema,
  onboard: {
    ...onboardingSchema,
    $defs: actionSchema.$defs,
    properties: { ...onboardingSchema.properties, tasks: { type: 'array', items: { $ref: '#/$defs/proposedTask' } } },
  },
  reminders: reminderSchema,
};
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
export const validators = {
  chat: ajv.compile<AssistantReply>(schemas.chat),
  onboard: ajv.compile<OnboardingResult>(schemas.onboard),
  reminders: ajv.compile<ReminderTexts>(schemas.reminders),
};
