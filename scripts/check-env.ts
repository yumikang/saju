/**
 * Environment Variables Validation Script
 *
 * 환경 변수 검증 및 보안 체크
 *
 * Usage:
 *   npx tsx scripts/check-env.ts [environment]
 *
 * Examples:
 *   npx tsx scripts/check-env.ts development
 *   npx tsx scripts/check-env.ts production
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// Types
// ============================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

interface EnvVar {
  name: string;
  required: boolean;
  validator?: (value: string) => { valid: boolean; message?: string };
  description: string;
}

// ============================================================
// Color utilities
// ============================================================

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

// ============================================================
// Validators
// ============================================================

const validators = {
  url: (value: string) => {
    try {
      new URL(value);
      return { valid: true };
    } catch {
      return { valid: false, message: 'Invalid URL format' };
    }
  },

  databaseUrl: (value: string) => {
    if (!value.startsWith('postgresql://')) {
      return { valid: false, message: 'Must start with postgresql://' };
    }
    return { valid: true };
  },

  redisUrl: (value: string) => {
    if (!value.startsWith('redis://')) {
      return { valid: false, message: 'Must start with redis://' };
    }
    return { valid: true };
  },

  tossClientKey: (value: string) => {
    const validPrefixes = ['test_ck_', 'live_ck_'];
    const hasValidPrefix = validPrefixes.some((prefix) => value.startsWith(prefix));

    if (!hasValidPrefix) {
      return {
        valid: false,
        message: 'Must start with test_ck_ or live_ck_',
      };
    }

    // Check for placeholder
    if (value.includes('YOUR') || value.includes('REPLACE')) {
      return {
        valid: false,
        message: 'Please replace with actual TossPayments key',
      };
    }

    return { valid: true };
  },

  tossSecretKey: (value: string) => {
    const validPrefixes = ['test_sk_', 'live_sk_'];
    const hasValidPrefix = validPrefixes.some((prefix) => value.startsWith(prefix));

    if (!hasValidPrefix) {
      return {
        valid: false,
        message: 'Must start with test_sk_ or live_sk_',
      };
    }

    // Check for placeholder
    if (value.includes('YOUR') || value.includes('REPLACE')) {
      return {
        valid: false,
        message: 'Please replace with actual TossPayments key',
      };
    }

    return { valid: true };
  },

  sessionSecret: (value: string) => {
    if (value.length < 32) {
      return {
        valid: false,
        message: 'Must be at least 32 characters long',
      };
    }

    // Check for placeholder
    if (value.includes('your_') || value.includes('REPLACE')) {
      return {
        valid: false,
        message: 'Please replace with a strong random secret',
      };
    }

    return { valid: true };
  },

  openaiKey: (value: string) => {
    if (!value.startsWith('sk-')) {
      return { valid: false, message: 'OpenAI key must start with sk-' };
    }

    if (value.includes('YOUR') || value.includes('REPLACE')) {
      return {
        valid: false,
        message: 'Please replace with actual OpenAI key',
      };
    }

    return { valid: true };
  },
};

// ============================================================
// Environment variable definitions
// ============================================================

const commonEnvVars: EnvVar[] = [
  {
    name: 'NODE_ENV',
    required: true,
    description: 'Application environment',
  },
  {
    name: 'APP_URL',
    required: true,
    validator: validators.url,
    description: 'Application base URL',
  },
  {
    name: 'DATABASE_URL',
    required: true,
    validator: validators.databaseUrl,
    description: 'PostgreSQL database connection string',
  },
  {
    name: 'REDIS_URL',
    required: true,
    validator: validators.redisUrl,
    description: 'Redis connection string',
  },
  {
    name: 'SESSION_SECRET',
    required: true,
    validator: validators.sessionSecret,
    description: 'Session encryption secret (min 32 chars)',
  },
];

const productionEnvVars: EnvVar[] = [
  ...commonEnvVars,
  {
    name: 'TOSS_CLIENT_KEY',
    required: true,
    validator: validators.tossClientKey,
    description: 'TossPayments client key (must start with live_ck_)',
  },
  {
    name: 'TOSS_SECRET_KEY',
    required: true,
    validator: validators.tossSecretKey,
    description: 'TossPayments secret key (must start with live_sk_)',
  },
  {
    name: 'OPENAI_API_KEY',
    required: true,
    validator: validators.openaiKey,
    description: 'OpenAI API key for name generation',
  },
];

const developmentEnvVars: EnvVar[] = [
  ...commonEnvVars,
  {
    name: 'TOSS_CLIENT_KEY',
    required: false,
    validator: validators.tossClientKey,
    description: 'TossPayments client key (test mode)',
  },
  {
    name: 'TOSS_SECRET_KEY',
    required: false,
    validator: validators.tossSecretKey,
    description: 'TossPayments secret key (test mode)',
  },
];

// ============================================================
// Validation functions
// ============================================================

function loadEnvFile(environment: string): Record<string, string> {
  const envFilePath = environment === 'production'
    ? path.join(process.cwd(), '.env.production')
    : path.join(process.cwd(), '.env');

  if (!fs.existsSync(envFilePath)) {
    throw new Error(`Environment file not found: ${envFilePath}`);
  }

  const envContent = fs.readFileSync(envFilePath, 'utf-8');
  const envVars: Record<string, string> = {};

  envContent.split('\n').forEach((line) => {
    line = line.trim();

    // Skip comments and empty lines
    if (line.startsWith('#') || line === '') {
      return;
    }

    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      envVars[key.trim()] = value;
    }
  });

  return envVars;
}

function validateEnvironment(
  environment: string,
  envVars: Record<string, string>
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  const varsToCheck =
    environment === 'production' ? productionEnvVars : developmentEnvVars;

  // Check each required variable
  varsToCheck.forEach((envVar) => {
    const value = envVars[envVar.name];

    if (!value || value.trim() === '') {
      if (envVar.required) {
        result.errors.push(
          `Missing required variable: ${envVar.name}\n  → ${envVar.description}`
        );
        result.valid = false;
      } else {
        result.warnings.push(
          `Optional variable not set: ${envVar.name}\n  → ${envVar.description}`
        );
      }
      return;
    }

    // Run validator if provided
    if (envVar.validator) {
      const validation = envVar.validator(value);
      if (!validation.valid) {
        result.errors.push(
          `Invalid ${envVar.name}: ${validation.message}\n  → Current value: ${value.substring(0, 20)}...`
        );
        result.valid = false;
      }
    }
  });

  // Production-specific checks
  if (environment === 'production') {
    // Check for test keys in production
    if (envVars.TOSS_CLIENT_KEY?.startsWith('test_')) {
      result.errors.push(
        'Production must use live TossPayments keys (live_ck_), not test keys'
      );
      result.valid = false;
    }

    if (envVars.TOSS_SECRET_KEY?.startsWith('test_')) {
      result.errors.push(
        'Production must use live TossPayments keys (live_sk_), not test keys'
      );
      result.valid = false;
    }

    // Check APP_URL is HTTPS
    if (envVars.APP_URL && !envVars.APP_URL.startsWith('https://')) {
      result.errors.push('Production APP_URL must use HTTPS');
      result.valid = false;
    }
  }

  return result;
}

// ============================================================
// Main function
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || process.env.NODE_ENV || 'development';

  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     Environment Variables Validation                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  logInfo(`Environment: ${environment}`);
  logInfo(`Checking: ${environment === 'production' ? '.env.production' : '.env'}\n`);

  try {
    // Load environment variables
    const envVars = loadEnvFile(environment);
    logSuccess(`Environment file loaded (${Object.keys(envVars).length} variables)\n`);

    // Validate
    const result = validateEnvironment(environment, envVars);

    // Display results
    log('─'.repeat(64), 'cyan');
    log('Validation Results', 'cyan');
    log('─'.repeat(64), 'cyan');

    if (result.errors.length > 0) {
      log('\n❌ ERRORS:', 'red');
      result.errors.forEach((error) => {
        logError(error);
      });
    }

    if (result.warnings.length > 0) {
      log('\n⚠️  WARNINGS:', 'yellow');
      result.warnings.forEach((warning) => {
        logWarning(warning);
      });
    }

    if (result.info.length > 0) {
      log('\nℹ️  INFO:', 'blue');
      result.info.forEach((info) => {
        logInfo(info);
      });
    }

    log('\n' + '─'.repeat(64), 'cyan');

    if (result.valid) {
      logSuccess('\n🎉 All checks passed! Environment is ready for deployment.\n');
      process.exit(0);
    } else {
      logError(
        `\n💥 Validation failed with ${result.errors.length} error(s).\n`
      );
      logInfo('Please fix the errors above and run the script again.\n');
      process.exit(1);
    }
  } catch (error) {
    logError(`\n${(error as Error).message}\n`);
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
