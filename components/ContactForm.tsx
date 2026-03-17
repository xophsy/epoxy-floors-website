"use client";

import { motion, AnimatePresence } from "framer-motion";
import emailjs from "@emailjs/browser";
import Image from "next/image";
import { type FormEvent, useMemo, useState } from "react";
import { cx } from "@/components/design-system";

/* ── Multi-choice question data ───────────────────────── */

type ChoiceOption = string | { label: string; hint?: string; image?: string };

type ChoiceQuestion = {
  id: string;
  label: string;
  options: ChoiceOption[];
};

function getOptionLabel(opt: ChoiceOption) {
  return typeof opt === "string" ? opt : opt.label;
}

function getOptionHint(opt: ChoiceOption) {
  return typeof opt === "string" ? null : opt.hint ?? null;
}

function getOptionImage(opt: ChoiceOption) {
  return typeof opt === "string" ? null : opt.image ?? null;
}

const questions: ChoiceQuestion[] = [
  {
    id: "style",
    label: "What look are you going for?",
    options: [
      { label: "Metallic / shimmer", image: "/legacy-images/metallic-floor.png" },
      { label: "Flake / terrazzo", image: "/legacy-images/flake-floor.png" },
      { label: "Solid color", image: "/legacy-images/solid-floor.png" },
      "Not sure yet",
    ],
  },
  {
    id: "space",
    label: "What kind of space is this for?",
    options: ["Garage", "Basement", "Showroom", "Warehouse", "Patio", "Commercial / Industrial", "Other"],
  },
  {
    id: "size",
    label: "How big is the space?",
    options: [
      { label: "Small", hint: "1-car garage or under 300 sq ft" },
      { label: "Medium", hint: "2-car garage or 300–700 sq ft" },
      { label: "Large", hint: "3+ car garage or 700+ sq ft" },
    ],
  },
  {
    id: "timeline",
    label: "When are you hoping to get started?",
    options: ["ASAP", "This month", "In the next few months", "Just exploring for now"],
  },
];

/* ── Form state ───────────────────────────────────────── */

type FormState = {
  space: string;
  size: string;
  style: string;
  timeline: string;
  name: string;
  phone: string;
  email: string;
  message: string;
};

const initialState: FormState = {
  space: "",
  size: "",
  style: "",
  timeline: "",
  name: "",
  phone: "",
  email: "",
  message: "",
};

/* ── Animations ───────────────────────────────────────── */

const stepVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

/* ── Component ────────────────────────────────────────── */

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const totalSteps = questions.length + 1; // multi-choice steps + final details step
  const emailJsConfig = useMemo(
    () => ({
      serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "",
      templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "",
      autoReplyTemplateId: process.env.NEXT_PUBLIC_EMAILJS_AUTOREPLY_TEMPLATE_ID ?? "",
      publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? "",
    }),
    [],
  );

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectChoice = (questionId: string, value: string) => {
    update(questionId as keyof FormState, value);
    // auto-advance after a short delay
    setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, 280);
  };

  const questionAnswers = questions.map((question) => ({
    id: question.id,
    label: question.label,
    answer: form[question.id as keyof FormState] || "Skipped",
  }));
  const projectSummary = questionAnswers
    .map(({ label, answer }) => `${label}: ${answer}`)
    .join("\n");
  const projectDetails = [
    `Look / system: ${form.style || "Not selected"}`,
    `Space: ${form.space || "Not selected"}`,
    `Size: ${form.size || "Not selected"}`,
    `Timeline: ${form.timeline || "Not selected"}`,
    `Anything else: ${form.message.trim() || "None"}`,
  ].join("\n");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError("");

    if (!emailJsConfig.serviceId || !emailJsConfig.templateId || !emailJsConfig.publicKey) {
      setSending(false);
      setError("Email is not configured yet. Please call or text us instead.");
      return;
    }

    const templateParams = {
      name: form.name.trim(),
      from_name: form.name.trim(),
      reply_to: form.email.trim(),
      phone: form.phone.trim() || "Not provided",
      email: form.email.trim(),
      phone_or_email: `${form.phone.trim()} / ${form.email.trim()}`,
      system: form.style || "Not selected",
      details: projectDetails,
      space: form.space || "Not selected",
      size: form.size || "Not selected",
      style: form.style || "Not selected",
      timeline: form.timeline || "Not selected",
      project_summary: projectSummary,
      message: form.message.trim() || "None",
      submitted_at: new Date().toLocaleString(),
    };

    try {
      await emailjs.send(
        emailJsConfig.serviceId,
        emailJsConfig.templateId,
        templateParams,
        emailJsConfig.publicKey,
      );

      if (emailJsConfig.autoReplyTemplateId) {
        try {
          await emailjs.send(
            emailJsConfig.serviceId,
            emailJsConfig.autoReplyTemplateId,
            templateParams,
            emailJsConfig.publicKey,
          );
        } catch (autoReplyError) {
          // Don't block lead capture if the courtesy autoresponder has a template issue.
          console.error("EmailJS autoresponse failed", autoReplyError);
        }
      }

      setSent(true);
    } catch {
      setError("Something went wrong — please try calling us instead.");
    } finally {
      setSending(false);
    }
  };

  const progress = ((step + 1) / totalSteps) * 100;
  const currentQuestion = step < questions.length ? questions[step] : null;

  if (sent) {
    return (
      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gold-400/20 bg-gold-400/5 p-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-400/15">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-gold-400">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">We got your request!</h3>
          <p className="text-sm text-white/50">We&apos;ll be in touch within one business day. If you need us sooner, call or text <a href="tel:+18135800323" className="text-gold-400">(813) 580-0323</a>.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
            Step {step + 1} of {totalSteps}
          </p>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400/70 hover:text-gold-400 transition-colors"
            >
              Back
            </button>
          )}
        </div>
        <div className="h-1 w-full rounded-full bg-white/8 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="relative min-h-[22rem]">
        <AnimatePresence mode="wait">
          {currentQuestion ? (
            <motion.div
              key={currentQuestion.id}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-xl font-semibold tracking-[-0.02em] text-white mb-6">
                {currentQuestion.label}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {currentQuestion.options.map((option) => {
                  const label = getOptionLabel(option);
                  const hint = getOptionHint(option);
                  const image = getOptionImage(option);
                  const selected = form[currentQuestion.id as keyof FormState] === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => selectChoice(currentQuestion.id, label)}
                      className={cx(
                        "rounded-2xl border text-left text-sm font-medium transition-all duration-200 cursor-pointer overflow-hidden",
                        image ? "p-0" : "px-5 py-4",
                        selected
                          ? "border-gold-400/50 bg-gold-400/10 text-gold-300 shadow-[0_0_20px_rgba(255,214,91,0.08)]"
                          : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06]",
                      )}
                    >
                      {image && (
                        <div className="relative h-28 w-full">
                          <Image
                            src={image}
                            alt={label}
                            fill
                            className="object-cover"
                            sizes="(min-width: 640px) 45vw, 90vw"
                          />
                        </div>
                      )}
                      <div className={image ? "px-4 py-3" : ""}>
                        {label}
                        {hint && (
                          <span className="block mt-0.5 text-xs font-normal text-white/35">
                            {hint}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Skip link */}
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
                className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/30 hover:text-white/50 transition-colors cursor-pointer"
              >
                Skip this question
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-xl font-semibold tracking-[-0.02em] text-white mb-2">
                Almost done — how should we reach you?
              </p>
              <p className="text-sm text-white/50 mb-6">
                We&apos;ll get back to you within one business day.
              </p>

              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <div className="field-shell">
                  <label className="field-label" htmlFor="name">
                    Your Name
                  </label>
                  <input
                    required
                    id="name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="First and last name"
                    className="field-input"
                  />
                </div>

                <div className="field-shell">
                  <label className="field-label" htmlFor="phone">
                    Phone
                  </label>
                  <input
                    required
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(813) 555-1234"
                    className="field-input"
                  />
                </div>

                <div className="field-shell">
                  <label className="field-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    required
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@email.com"
                    className="field-input"
                  />
                </div>

                <div className="field-shell sm:col-span-2">
                  <label className="field-label" htmlFor="message">
                    Anything else? <span className="text-white/30 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="Color ideas, questions, anything you'd like us to know"
                    className="field-input"
                    rows={3}
                  />
                </div>

                <div className="sm:col-span-2 space-y-4">
                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={sending} className="button-base button-primary sm:w-auto disabled:opacity-50">
                      {sending ? "Sending…" : "Get My Free Estimate"}
                    </button>
                    <a href="tel:+18135800323" className="button-base button-secondary sm:w-auto">
                      Text or Call (813) 580-0323
                    </a>
                  </div>

                  {/* Trust line */}
                  <p className="flex items-center gap-2 text-xs text-white/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="h-3.5 w-3.5 flex-shrink-0 text-white/25"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Your information is secure and only used to contact you about your project.
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selection summary pills */}
      {step > 0 && (
        <motion.div
          className="mt-6 flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {questions.slice(0, step).map((q) => {
            const value = form[q.id as keyof FormState];
            if (!value) return null;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setStep(questions.indexOf(q))}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/50 hover:border-gold-400/30 hover:text-gold-300 transition-colors cursor-pointer"
              >
                {value}
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
