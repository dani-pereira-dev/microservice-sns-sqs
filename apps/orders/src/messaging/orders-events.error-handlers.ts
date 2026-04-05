import { BadRequestException, NotFoundException } from '@nestjs/common';

export const resolveOrderConfirmationFailure = (error: unknown) => {
  if (
    error instanceof BadRequestException ||
    error instanceof NotFoundException
  ) {
    return {
      handled: true as const,
      reason: error.message || 'Order confirmation failed for business reasons.',
    };
  }

  return {
    handled: false as const,
    reason: null,
  };
};
