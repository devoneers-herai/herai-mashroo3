export async function scrub(input: string): Promise<string> {
  // Minimal PII scrubber: redact emails and phone-like numbers.
  let out = input.replace(/\b\S+@\S+\.\S+\b/g, '[REDACTED_EMAIL]')
  out = out.replace(/\b\+?\d[\d\-\s]{7,}\b/g, '[REDACTED_PHONE]')
  return out
}

export default { scrub }
