import type { Rule } from "../schema.ts";

export const dateTimeInput: Rule = {
  id: "date-time-input",
  title: "Date and time pickers",
  replaces: [
    "react-datepicker",
    "flatpickr",
    "react-flatpickr",
    "react-day-picker",
    "@mui/x-date-pickers",
    "ng2-date-picker",
  ],
  featureIds: ["input-date-time"],
  native: '<input type="date"> and <input type="time">',
  human: {
    explainer:
      'A date-picker library ships its own calendar grid, keyboard navigation, and locale formatting, all as JavaScript and CSS you maintain. The browser already has a calendar and clock picker built in: type="date" and type="time" give you locale-aware formatting, keyboard entry, and min/max validation with a single attribute, and the picker UI itself never needs styling because you never render it.',
    snippet: `<label>
  Departure date
  <input type="date" min="2024-01-01" required>
</label>`,
    mdnUrl:
      "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date",
  },
  agent: {
    when: "collecting a single date or time value from a form",
    unless: [
      "You need a date range, picking a start and end date in one control. The native input only holds one value.",
      "You need the calendar's own appearance to match your design. Its popup is rendered by the browser or OS and cannot be restyled.",
      "You need to disable specific dates, such as holidays or already-booked days, rather than a single continuous min/max range.",
      'You need type="week" or type="month". Their browser support has not caught up to type="date" and type="time".',
    ],
    snippet: `<input type="date" min="2024-01-01" required>`,
  },
};
