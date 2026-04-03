const ANSI_RESET = '\x1b[0m';
const ANSI_BRIGHT_CYAN = '\x1b[96m';
const ANSI_BRIGHT_GREEN = '\x1b[92m';
const ANSI_BRIGHT_MAGENTA = '\x1b[95m';
const ANSI_BRIGHT_YELLOW = '\x1b[93m';

export function formatSnsLog(message: string) {
  return `${ANSI_BRIGHT_CYAN}[SNS]${ANSI_RESET} ${message}`;
}

export function formatSqsLog(message: string) {
  return `${ANSI_BRIGHT_YELLOW}[SQS]${ANSI_RESET} ${message}`;
}

export function formatOrdersLog(message: string) {
  return `${ANSI_BRIGHT_GREEN}[ORDERS]${ANSI_RESET} ${message}`;
}

export function formatNotificationLog(message: string) {
  return `${ANSI_BRIGHT_MAGENTA}[NOTIFICATION]${ANSI_RESET} ${message}`;
}
