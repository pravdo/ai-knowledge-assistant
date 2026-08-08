// Field names from docs/architecture.md §Structured logs — kept identical between the TypeScript
// and Python services so cross-service queries work. There is deliberately no "content"/"body"
// field: never log raw documents, prompts, responses, tokens, or credentials by default (§9.6).
export interface LogContext {
  requestId?: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  workspaceId?: string;
  documentId?: string;
  documentVersion?: number;
  jobId?: string;
  conversationId?: string;
  messageId?: string;
  evaluationId?: string;
  provider?: string;
  modelId?: string;
  promptVersion?: string;
  ragConfigurationVersion?: number;
  coldStart?: boolean;
  durationMs?: number;
  status?: string;
  errorCode?: string;
  retryCount?: number;
}

export interface LoggerOptions {
  service: string;
  environment: string;
  applicationVersion: string;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
}

type Level = 'debug' | 'info' | 'warn' | 'error';

function write(level: Level, message: string, options: LoggerOptions, context: LogContext): void {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    service: options.service,
    environment: options.environment,
    applicationVersion: options.applicationVersion,
    ...context,
  });
  console.log(line);
}

export function createLogger(options: LoggerOptions, baseContext: LogContext = {}): Logger {
  return {
    debug: (message, context) => write('debug', message, options, { ...baseContext, ...context }),
    info: (message, context) => write('info', message, options, { ...baseContext, ...context }),
    warn: (message, context) => write('warn', message, options, { ...baseContext, ...context }),
    error: (message, context) => write('error', message, options, { ...baseContext, ...context }),
    child: (context) => createLogger(options, { ...baseContext, ...context }),
  };
}
