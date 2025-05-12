import { Controller, Get } from '@nestjs/common';

/**
 * Main application controller
 * Handles basic endpoints like health checks
 */
@Controller('health')
export class AppController {
  /**
   * Health check endpoint
   * Used to verify the API is running
   */
  @Get()
  health() {
    return { status: 'ok' };
  }
} 