import { db } from './db';

export interface LogEmployeeActivityParams {
    employee_id: bigint;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
    entity_type: string;
    entity_id?: bigint;
    field_name?: string;
    old_value?: string;
    new_value?: string;
    reason?: string;
    actor_id?: bigint;
    actor_role?: string;
    ip_address?: string;
    user_agent?: string;
}

export async function logEmployeeActivity(params: LogEmployeeActivityParams) {
    try {
        await db.employeeLog.create({
            data: {
                employee_id: params.employee_id,
                action: params.action,
                entity_type: params.entity_type,
                entity_id: params.entity_id,
                field_name: params.field_name,
                old_value: params.old_value,
                new_value: params.new_value,
                reason: params.reason,
                actor_id: params.actor_id,
                actor_role: params.actor_role,
                ip_address: params.ip_address,
                user_agent: params.user_agent,
            },
        });
    } catch (error) {
        console.error('Failed to log employee activity:', error);
        // Don't throw error to avoid breaking the main operation
    }
}

// Helper function to get actor info from request
export function getActorInfo(request: Request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    return {
        ip_address: ip,
        user_agent: userAgent,
    };
}
