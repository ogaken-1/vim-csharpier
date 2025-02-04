export type Result<T extends object> = ({ ok: true } & T) | { ok: false };
