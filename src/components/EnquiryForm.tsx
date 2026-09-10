"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { siteConfig, subjectOptions, yearGroups } from "@/lib/site";

type FormValues = {
  parentName: string;
  email: string;
  phone: string;
  yearGroup: string;
  subject: string;
  support: string;
  contactMethod: string;
};

type FieldName = keyof FormValues;
type FormErrors = Partial<Record<FieldName, string>>;
type FormStatus = "idle" | "preparing" | "prepared";

const initialValues: FormValues = {
  parentName: "",
  email: "",
  phone: "",
  yearGroup: "",
  subject: "",
  support: "",
  contactMethod: "Email",
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.parentName.trim()) {
    errors.parentName = "Enter the parent or guardian’s name.";
  }
  if (!values.email.trim()) {
    errors.email = "Enter an email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (values.contactMethod === "Phone" && !values.phone.trim()) {
    errors.phone = "Enter a phone number when phone is your preferred contact method.";
  } else if (
    values.phone.trim() &&
    !/^[0-9+()\s-]{7,25}$/.test(values.phone.trim())
  ) {
    errors.phone = "Enter a valid phone number, or leave this field blank.";
  }
  if (!values.yearGroup) {
    errors.yearGroup = "Choose the student’s year group.";
  }
  if (!values.subject) {
    errors.subject = "Choose a subject.";
  }
  if (!values.support.trim()) {
    errors.support = "Briefly describe the support you are looking for.";
  } else if (values.support.trim().length < 20) {
    errors.support = "Please add a little more detail (at least 20 characters).";
  }

  return errors;
}

function createMailto(values: FormValues) {
  const subject = `Free consultation enquiry — ${values.subject}`;
  const body = [
    "Hello LearnThrive Tuition,",
    "",
    "I would like to arrange a free consultation.",
    "",
    `Parent/guardian: ${values.parentName}`,
    `Email: ${values.email}`,
    `Phone: ${values.phone || "Not provided"}`,
    `Student year group: ${values.yearGroup}`,
    `Subject: ${values.subject}`,
    `Preferred contact method: ${values.contactMethod}`,
    "",
    "Support required:",
    values.support,
    "",
    "Kind regards,",
    values.parentName,
  ].join("\n");

  return `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function EnquiryForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [mailto, setMailto] = useState("");
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const preparedRef = useRef<HTMLDivElement>(null);

  function updateField(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name] || (name === "contactMethod" && errors.phone)) {
      setErrors((current) => ({
        ...current,
        [name]: undefined,
        ...(name === "contactMethod" && value === "Email"
          ? { phone: undefined }
          : {}),
      }));
    }
    if (status === "prepared") setStatus("idle");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("idle");
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    setErrors({});
    setStatus("preparing");
    const link = createMailto(values);

    window.requestAnimationFrame(() => {
      setMailto(link);
      setStatus("prepared");
      window.requestAnimationFrame(() => preparedRef.current?.focus());
    });
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form className="enquiry-form" noValidate onSubmit={handleSubmit}>
      {hasErrors ? (
        <div
          className="form-message form-message--error"
          role="alert"
          tabIndex={-1}
          ref={errorSummaryRef}
        >
          <strong>Check the highlighted fields.</strong>
          <p>We have not prepared the enquiry yet.</p>
        </div>
      ) : null}

      {status === "prepared" ? (
        <div
          className="form-message form-message--prepared"
          role="status"
          tabIndex={-1}
          ref={preparedRef}
        >
          <strong>Your enquiry email is ready.</strong>
          <p>
            Review and send it in your email app to complete your enquiry. No
            information has been submitted by this website.
          </p>
          <a className="button button--primary" href={mailto}>
            <span>Open email to review and send</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h11M11 6l4 4-4 4" />
            </svg>
          </a>
        </div>
      ) : null}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="parent-name">Parent or guardian name</label>
          <input
            id="parent-name"
            name="parentName"
            autoComplete="name"
            value={values.parentName}
            onChange={(event) => updateField("parentName", event.target.value)}
            aria-invalid={Boolean(errors.parentName)}
            aria-describedby={errors.parentName ? "parent-name-error" : undefined}
            maxLength={100}
            required
          />
          {errors.parentName ? (
            <span className="field-error" id="parent-name-error">
              {errors.parentName}
            </span>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            maxLength={160}
            required
          />
          {errors.email ? (
            <span className="field-error" id="email-error">
              {errors.email}
            </span>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="phone">
            Phone number{" "}
            <span>
              {values.contactMethod === "Phone"
                ? "(required for phone contact)"
                : "(optional)"}
            </span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            maxLength={25}
            required={values.contactMethod === "Phone"}
          />
          {errors.phone ? (
            <span className="field-error" id="phone-error">
              {errors.phone}
            </span>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="year-group">Student’s year group</label>
          <select
            id="year-group"
            name="yearGroup"
            value={values.yearGroup}
            onChange={(event) => updateField("yearGroup", event.target.value)}
            aria-invalid={Boolean(errors.yearGroup)}
            aria-describedby={errors.yearGroup ? "year-group-error" : undefined}
            required
          >
            <option value="">Select a year group</option>
            {yearGroups.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {errors.yearGroup ? (
            <span className="field-error" id="year-group-error">
              {errors.yearGroup}
            </span>
          ) : null}
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="subject">Subject</label>
          <select
            id="subject"
            name="subject"
            value={values.subject}
            onChange={(event) => updateField("subject", event.target.value)}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? "subject-error" : undefined}
            required
          >
            <option value="">Select a subject</option>
            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          {errors.subject ? (
            <span className="field-error" id="subject-error">
              {errors.subject}
            </span>
          ) : null}
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="support-required">What support are you looking for?</label>
          <textarea
            id="support-required"
            name="support"
            rows={6}
            value={values.support}
            onChange={(event) => updateField("support", event.target.value)}
            aria-invalid={Boolean(errors.support)}
            aria-describedby={errors.support ? "support-hint support-error" : "support-hint"}
            maxLength={1000}
            required
          />
          <span className="field-hint" id="support-hint">
            Please avoid including sensitive personal or medical information.
          </span>
          {errors.support ? (
            <span className="field-error" id="support-error">
              {errors.support}
            </span>
          ) : null}
        </div>
      </div>

      <fieldset className="contact-preference">
        <legend>Preferred contact method</legend>
        <div>
          {["Email", "Phone"].map((method) => (
            <label key={method}>
              <input
                type="radio"
                name="contactMethod"
                value={method}
                checked={values.contactMethod === method}
                onChange={(event) =>
                  updateField("contactMethod", event.target.value)
                }
              />
              <span>{method}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-actions">
        <button
          className="button button--primary"
          type="submit"
          disabled={status === "preparing"}
        >
          <span>
            {status === "preparing" ? "Preparing enquiry…" : "Prepare enquiry email"}
          </span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h11M11 6l4 4-4 4" />
          </svg>
        </button>
        <p>
          This form prepares an email on your device. You will review and send
          it yourself; the website does not store your answers. Read our{" "}
          <Link href="/privacy">privacy notice</Link> for how enquiry information
          is used once you send it.
        </p>
      </div>
    </form>
  );
}
