import { z } from 'zod';

const questionSchema = z.object({
  id: z.string().min(1).max(100),
  label: z.string().trim().min(1).max(240),
  answerType: z.enum(['single', 'multiple', 'text', 'number']).default('single'),
  enabled: z.boolean(),
  required: z.boolean(),
  weight: z.number().positive().max(1000),
  pointsByOption: z.record(z.string(), z.number().min(0).max(100)).nullable(),
}).strict();

export const qualificationFormSchema = z.object({
  questions: z.array(questionSchema).min(1).max(100),
  thresholds: z.object({ mediumMinimum: z.number().min(0).max(100), highMinimum: z.number().min(0).max(100) }).strict(),
}).strict().superRefine((form, context) => {
  const ids = form.questions.map((question) => question.id);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', path: ['questions'], message: 'Question IDs must be unique' });
  if (!form.questions.some((question) => question.enabled)) context.addIssue({ code: 'custom', path: ['questions'], message: 'At least one question must be enabled' });
  if (form.thresholds.mediumMinimum >= form.thresholds.highMinimum) context.addIssue({ code: 'custom', path: ['thresholds'], message: 'Medium threshold must be less than high threshold' });
});

export const qualificationAnswersSchema = z.record(z.string(), z.union([z.string(), z.array(z.string()), z.number().finite(), z.null()]));
export type QualificationForm = z.infer<typeof qualificationFormSchema>;
