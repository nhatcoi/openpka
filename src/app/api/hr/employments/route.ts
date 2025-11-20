import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { db } from '@/lib/db';

// GET - Lấy danh sách hợp đồng lao động
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
        requirePermission(session, 'hr.employment.view');
    }
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employee_id');

        let whereClause = {};
        if (employeeId) {
            whereClause = {
                employee_id: BigInt(employeeId)
            };
        }

        const employments = await db.Employment.findMany({
            where: whereClause,
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            },
            orderBy: {
                start_date: 'desc'
            }
        });

        // Convert BigInt to string for JSON serialization
        const serializedEmployments = employments.map((employment: { id: bigint; [key: string]: unknown }) => ({
            ...employment,
            id: employment.id.toString(),
            employee_id: employment.employee_id.toString(),
            Employee: employment.employees ? {
                ...employment.employees,
                id: employment.employees.id.toString(),
                user_id: employment.employees.user_id?.toString() || null,
                User: employment.employees.user ? {
                    ...employment.employees.user,
                    id: employment.employees.user.id.toString()
                } : null
            } : null
        }));

        return NextResponse.json({ success: true, data: serializedEmployments });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Database connection failed'
            },
            { status: 500 }
        );
    }
}

// POST - Tạo hợp đồng lao động mới
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Check permission
        requirePermission(session, 'hr.employment.create');
        
        const body = await request.json();
        const { employee_id, contract_no, contract_type, start_date, end_date, fte, salary_band } = body;

        if (!employee_id || !contract_no || !contract_type || !start_date || !fte || !salary_band) {
            return NextResponse.json(
                { success: false, error: 'Tất cả các trường bắt buộc phải được điền' },
                { status: 400 }
            );
        }

        const employment = await db.Employment.create({
            data: {
                employee_id: BigInt(employee_id),
                contract_no,
                contract_type,
                start_date: new Date(start_date),
                end_date: end_date ? new Date(end_date) : null,
                fte: parseFloat(fte),
                salary_band
            },
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...employment,
                id: employment.id.toString(),
                employee_id: employment.employee_id.toString(),
                Employee: employment.employees ? {
                    ...employment.employees,
                    id: employment.employees.id.toString(),
                    user_id: employment.employees.user_id?.toString() || null,
                    User: employment.employees.user ? {
                        ...employment.employees.user,
                        id: employment.employees.user.id.toString()
                    } : null
                } : null
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Database connection failed'
            },
            { status: 500 }
        );
    }
}
