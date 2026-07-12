"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setTemplateActive,
  type ScheduleState,
} from "@/app/actions/schedule-admin";
import { CLASS_TYPES } from "@/lib/constants";
import { DAY_LABELS, formatMinutes } from "@/lib/schedule";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

const CLASS_TYPE_VALUES = Object.values(CLASS_TYPES);
const DAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type ManagerTemplate = {
  id: string;
  classType: string;
  coachId: string | null;
  coachName: string | null;
  dayOfWeek: number;
  startMin: number;
  endMin: number;
  capacity: number;
  active: boolean;
};

export type ManagerCoach = { id: string; name: string };

function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed rounded-full bg-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function Msg({ state }: { state: ScheduleState }) {
  if (!state) return null;
  if (state.error)
    return <span className="text-sm text-blood">{state.error}</span>;
  if (state.ok) return <span className="text-sm text-gold">{state.ok}</span>;
  return null;
}

// The shared set of fields used by both the add and edit forms. Defaults come
// from an existing template when editing; sensible blanks when adding.
function TemplateFields({
  coaches,
  showDay,
  showActive,
  template,
}: {
  coaches: ManagerCoach[];
  showDay: boolean;
  showActive: boolean;
  template?: ManagerTemplate;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
            Class
          </span>
          <select
            name="classType"
            defaultValue={template?.classType ?? CLASS_TYPE_VALUES[0]}
            className={field}
          >
            {CLASS_TYPE_VALUES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
            Coach
          </span>
          <select
            name="coachId"
            defaultValue={template?.coachId ?? ""}
            className={field}
          >
            <option value="">No coach — Open Gym / unstaffed</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {showDay ? (
          <label className="grid gap-1.5">
            <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
              Day
            </span>
            <select
              name="dayOfWeek"
              defaultValue={template?.dayOfWeek ?? 1}
              className={field}
            >
              {DAY_FULL.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="grid gap-1.5">
          <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
            Start
          </span>
          <input
            type="time"
            name="startTime"
            required
            defaultValue={template ? minToTime(template.startMin) : "18:00"}
            className={field}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
            End
          </span>
          <input
            type="time"
            name="endTime"
            required
            defaultValue={template ? minToTime(template.endMin) : "19:00"}
            className={field}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
            Capacity
          </span>
          <input
            type="number"
            name="capacity"
            min={1}
            required
            defaultValue={template?.capacity ?? 10}
            className={field}
          />
        </label>
      </div>

      {showActive ? (
        <label className="flex items-center gap-2.5 text-sm text-cream/80">
          <input
            type="checkbox"
            name="active"
            defaultChecked={template?.active ?? true}
            className="size-4 accent-gold"
          />
          <span className="font-condensed tracking-widest uppercase">
            Active (shows on the schedule)
          </span>
        </label>
      ) : null}
    </div>
  );
}

function AddClassForm({
  dayOfWeek,
  coaches,
  onDone,
}: {
  dayOfWeek: number;
  coaches: ManagerCoach[];
  onDone: () => void;
}) {
  const [state, action] = useActionState(createTemplate, undefined);
  return (
    <form
      action={action}
      className="mt-3 rounded-2xl border border-oxblood-600/50 bg-ink/40 p-4"
    >
      <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
      <TemplateFields coaches={coaches} showDay={false} showActive={false} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Submit label="Add class" />
        <button
          type="button"
          onClick={onDone}
          className="font-condensed rounded-full border border-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink"
        >
          Cancel
        </button>
        <Msg state={state} />
      </div>
    </form>
  );
}

function EditClassForm({
  template,
  coaches,
  onDone,
}: {
  template: ManagerTemplate;
  coaches: ManagerCoach[];
  onDone: () => void;
}) {
  const [state, action] = useActionState(updateTemplate, undefined);
  return (
    <form
      action={action}
      className="mt-3 rounded-2xl border border-oxblood-600/50 bg-ink/40 p-4"
    >
      <input type="hidden" name="id" value={template.id} />
      <TemplateFields
        coaches={coaches}
        showDay
        showActive
        template={template}
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Submit label="Save changes" />
        <button
          type="button"
          onClick={onDone}
          className="font-condensed rounded-full border border-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink"
        >
          Cancel
        </button>
        <Msg state={state} />
      </div>
    </form>
  );
}

function ClassRow({
  template,
  coaches,
}: {
  template: ManagerTemplate;
  coaches: ManagerCoach[];
}) {
  const [editing, setEditing] = useState(false);
  return (
    <li className="rounded-2xl border border-oxblood-600/40 bg-ink/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-bone">
            {template.classType}
            {!template.active && (
              <span className="font-condensed rounded-full bg-blood/20 px-2.5 py-0.5 text-xs tracking-widest text-blood uppercase">
                Paused
              </span>
            )}
          </p>
          <p className="font-condensed text-sm tracking-wide text-cream/55">
            {formatMinutes(template.startMin)} – {formatMinutes(template.endMin)}
            {" · "}
            {template.coachName ?? "Unstaffed"}
            {" · "}
            {template.capacity} spots
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action={setTemplateActive.bind(null, template.id, !template.active)}>
            <button
              type="submit"
              className="font-condensed rounded-full border border-oxblood-600/60 px-4 py-1.5 text-xs font-semibold tracking-widest text-cream/70 uppercase transition-colors hover:border-gold hover:text-gold"
            >
              {template.active ? "Pause" : "Resume"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="font-condensed rounded-full border border-gold px-4 py-1.5 text-xs font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink"
          >
            {editing ? "Close" : "Edit"}
          </button>
          <form action={deleteTemplate}>
            <input type="hidden" name="id" value={template.id} />
            <button
              type="submit"
              className="font-condensed rounded-full border border-blood/60 px-4 py-1.5 text-xs font-semibold tracking-widest text-blood uppercase transition-colors hover:bg-blood hover:text-bone"
            >
              Remove
            </button>
          </form>
        </div>
      </div>
      {editing && (
        <EditClassForm
          template={template}
          coaches={coaches}
          onDone={() => setEditing(false)}
        />
      )}
    </li>
  );
}

function DaySection({
  dayOfWeek,
  templates,
  coaches,
}: {
  dayOfWeek: number;
  templates: ManagerTemplate[];
  coaches: ManagerCoach[];
}) {
  const [adding, setAdding] = useState(false);
  return (
    <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-poster text-2xl text-bone">
          {DAY_FULL[dayOfWeek]}
        </h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="font-condensed rounded-full bg-gold px-5 py-2 text-xs font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone"
        >
          {adding ? "Close" : "+ Add class"}
        </button>
      </div>

      {templates.length === 0 && !adding ? (
        <p className="text-sm text-cream/40">No classes on {DAY_LABELS[dayOfWeek]}.</p>
      ) : (
        <ul className="grid gap-3">
          {templates.map((t) => (
            <ClassRow key={t.id} template={t} coaches={coaches} />
          ))}
        </ul>
      )}

      {adding && (
        <AddClassForm
          dayOfWeek={dayOfWeek}
          coaches={coaches}
          onDone={() => setAdding(false)}
        />
      )}
    </section>
  );
}

export function ScheduleManager({
  templates,
  coaches,
}: {
  templates: ManagerTemplate[];
  coaches: ManagerCoach[];
}) {
  return (
    <div className="grid gap-6">
      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
        <DaySection
          key={day}
          dayOfWeek={day}
          templates={templates.filter((t) => t.dayOfWeek === day)}
          coaches={coaches}
        />
      ))}
    </div>
  );
}
