/**
 * Helper functions to set PostgreSQL session variables for trigger context
 * These variables are used by academic_history triggers to capture actor info and request context
 */


export interface HistoryContext {
  actorId?: bigint | string | number;
  actorName?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Set session variables for history tracking within a transaction
 * These variables will be read by the log_academic_history() trigger function
 * 
 * @param tx - Prisma transaction client or db instance
 * @param context - History context to set
 */
export async function setHistoryContext(
  tx: any,
  context: HistoryContext
): Promise<void> {
  try {
    // Escape single quotes in string values for SQL
    const escape = (str: string | null | undefined): string => {
      if (!str) return '';
      return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
    };

    // Set session variables using raw SQL with string interpolation
    // Note: Using string interpolation because set_config with parameterized queries doesn't work well
    // These variables persist for the duration of the database connection/transaction
    const actorIdStr = context.actorId?.toString() || '';
    
    // IMPORTANT: Execute these BEFORE any other queries in the transaction
    // to ensure session variables are set before triggers fire
    
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.actor_id', '${escape(actorIdStr)}', false)`
    );

    if (context.actorName) {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.actor_name', '${escape(context.actorName)}', false)`
      );
    }

    if (context.userAgent) {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.user_agent', '${escape(context.userAgent)}', false)`
      );
    }

    if (context.metadata) {
      const metadataStr = JSON.stringify(context.metadata);
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.metadata', '${escape(metadataStr)}', false)`
      );
    }
  } catch (error) {
    // Log error but don't throw - triggers will still work without context
    console.error('Failed to set history context:', error);
    console.warn('History will be created without actor info - triggers will still work');
  }
}

/**
 * Clear history context (set to empty) within a transaction
 */
export async function clearHistoryContext(tx: any): Promise<void> {
  try {
    await tx.$executeRawUnsafe(`SELECT set_config('app.actor_id', '', false)`);
    await tx.$executeRawUnsafe(`SELECT set_config('app.actor_name', '', false)`);
    await tx.$executeRawUnsafe(`SELECT set_config('app.user_agent', '', false)`);
    await tx.$executeRawUnsafe(`SELECT set_config('app.metadata', '', false)`);
  } catch (error) {
    console.warn('Failed to clear history context:', error);
  }
}

/**
 * Helper to extract request context from Next.js Request object
 */
export function getRequestContext(request?: Request): {
  userAgent: string | null;
} {
  if (!request) {
    return { userAgent: null };
  }

  const userAgent = request.headers.get('user-agent') || null;

  return { userAgent };
}

/**
 * Get actor info from session and user data
 */
export async function getActorInfo(
  userId: bigint | string | number | undefined,
  db: any
): Promise<{ actorId: bigint | null; actorName: string | null }> {
  if (!userId) {
    return { actorId: null, actorName: null };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: BigInt(userId) },
      select: { id: true, full_name: true },
    });

    if (user) {
      return {
        actorId: BigInt(user.id),
        actorName: user.full_name || null,
      };
    }
  } catch (error) {
    console.warn('Failed to get actor info:', error);
  }

  return {
    actorId: BigInt(userId),
    actorName: null,
  };
}

