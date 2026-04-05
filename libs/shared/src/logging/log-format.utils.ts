const ANSI_RESET = '\x1b[0m';
const ANSI_BRIGHT_CYAN = '\x1b[96m';
const ANSI_BRIGHT_GREEN = '\x1b[92m';
const ANSI_BRIGHT_MAGENTA = '\x1b[95m';
const ANSI_BRIGHT_YELLOW = '\x1b[93m';
const ANSI_BRIGHT_BLUE = '\x1b[94m';
const ANSI_BRIGHT_RED = '\x1b[91m';
const ANSI_BRIGHT_WHITE = '\x1b[97m';

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

export function formatCartLog(message: string) {
  return `${ANSI_BRIGHT_BLUE}[CART]${ANSI_RESET} ${message}`;
}

export function formatPaymentsLog(message: string) {
  return `${ANSI_BRIGHT_RED}[PAYMENTS]${ANSI_RESET} ${message}`;
}

export function formatProductsLog(message: string) {
  return `${ANSI_BRIGHT_WHITE}[PRODUCTS]${ANSI_RESET} ${message}`;
}
