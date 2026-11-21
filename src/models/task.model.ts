import { Schema, model, type InferSchemaType } from 'mongoose';

export const TASK_STATUSES = ['pending', 'in-progress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: TASK_STATUSES, default: 'pending' },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    versionKey: false,
    toJSON: {
      // Expose `id` instead of `_id` in API responses.
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

export type Task = InferSchemaType<typeof taskSchema>;

export const TaskModel = model('Task', taskSchema);
