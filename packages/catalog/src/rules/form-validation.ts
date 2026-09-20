import type { Rule } from "../schema.ts";

export const formValidation: Rule = {
  id: "form-validation",
  title: "Form validation",
  category: "forms",
  replaces: ["jquery-validation", "parsleyjs"],
  featureIds: ["constraint-validation", "user-pseudos"],
  native: "constraint validation with :user-invalid",
  human: {
    explainer:
      "required, type, pattern, min and maxlength already describe what a valid field looks like, and the browser checks them on submit. The reason people reached for a library was the styling: :invalid matches an empty required field before anyone has typed, so a pristine form lights up red. :user-invalid only matches after the field has been interacted with, which is the behaviour those libraries were emulating.",
    snippet: `<input type="email" name="email" required>

<style>
  /* Only after the user has typed and left the field. */
  input:user-invalid {
    border-color: crimson;
  }
  input:user-valid {
    border-color: seagreen;
  }
</style>`,
    mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid",
  },
  agent: {
    when: "validating form fields and showing which ones are wrong",
    unless: [
      "A field's validity depends on another field, such as confirming a password. That needs setCustomValidity called from your own comparison, which is JavaScript either way.",
      "Validation needs the server, such as checking whether a username is taken. Constraint validation is synchronous and local, so an async check is yours to write and to hold the submit for.",
      "You need error text placed and styled in the page. The browser's own bubble cannot be styled or positioned, so rendering messages means reading validationMessage and turning off novalidate reporting yourself.",
      "You share one validation schema between client and server. These libraries let rules be declared once in JavaScript, and attributes in markup cannot be reused by the server.",
      "Your support target reaches below Chrome {{chrome:user-pseudos}}, Firefox {{firefox:user-pseudos}} or Safari {{safari:user-pseudos}}. Constraint validation itself is much older, so the checking works while the pseudo-class that makes the styling bearable does not.",
    ],
    snippet: "input:user-invalid { border-color: crimson; }",
    handRolled: [
      "a submit handler running a regex against each field's value and collecting error strings into state",
      "a touched or dirty flag tracked per field so an error only appears after the field has been left",
    ],
  },
};
