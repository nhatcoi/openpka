import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Định nghĩa quyền hạn cho từng route
const ROUTE_PERMISSIONS: Record<string, string[]> = {
    // HR Routes
    '/hr/dashboard': ['hr.dashboard.view'],
    '/hr/employees': ['hr.employees.view'],
    '/hr/employees/new': ['hr.employees.create'],
    '/hr/employees/[id]/edit': ['hr.employees.update'],
    '/hr/roles': ['hr.roles.view'],
    '/hr/roles/new': ['hr.roles.create'],
    '/hr/roles/[id]/edit': ['hr.roles.update'],
    '/hr/permissions': ['hr.permissions.view'],
    '/hr/permissions/new': ['hr.permissions.create'],
    '/hr/permissions/[id]/edit': ['hr.permissions.update'],
    '/hr/role-permissions': ['hr.role_permissions.view'],
    '/hr/role-permissions/new': ['hr.role_permissions.create'],
    '/hr/user-roles': ['hr.user_roles.view'],
    '/hr/user-roles/new': ['hr.user_roles.create'],
    '/hr/employee-logs': ['hr.employee_logs.view'],
    '/hr/performance-reviews': ['hr.performance_reviews.view'],
    '/hr/performance-reviews/new': ['hr.performance_reviews.create'],
    '/hr/academic-titles': ['hr.academic_titles.view'],
    '/hr/academic-titles/new': ['hr.academic_titles.create'],
    '/hr/academic-titles/[id]/edit': ['hr.academic_titles.update'],
    '/hr/employee-academic-titles': ['hr.employee_academic_titles.view'],
    '/hr/employee-academic-titles/new': ['hr.employee_academic_titles.create'],
    '/hr/trainings': ['hr.trainings.view'],
    '/hr/trainings/new': ['hr.trainings.create'],
    '/hr/trainings/[id]/edit': ['hr.trainings.update'],
    '/hr/employee-trainings': ['hr.employee_trainings.view'],
    '/hr/employee-trainings/new': ['hr.employee_trainings.create'],
    '/hr/qualifications': ['hr.qualifications.view'],
    '/hr/qualifications/new': ['hr.qualifications.create'],
    '/hr/qualifications/[id]/edit': ['hr.qualifications.update'],
    '/hr/employee-qualifications': ['hr.employee_qualifications.view'],
    '/hr/employee-qualifications/new': ['hr.employee_qualifications.create'],
    '/hr/employments': ['hr.employments.view'],
    '/hr/employments/new': ['hr.employments.create'],
    '/hr/employments/[id]/edit': ['hr.employments.update'],
    '/hr/org-structure': ['hr.org_structure.view'],
    '/hr/org-tree': ['hr.org_tree.view'],
    '/hr/faculty': ['hr.faculty.view'],
    '/hr/university-overview': ['hr.university_overview.view'],
    '/hr/reports': ['hr.reports.view'],
    '/hr/profile': ['hr.profile.view'],
    '/hr/change-password': ['hr.profile.update'],

    // Org Routes
    '/org/dashboard': ['org_unit.unit.view'],
    '/org/tree': ['org_unit.unit.view'],
    '/org/diagram': ['org_unit.unit.view'],
    '/org/unit': ['org_unit.unit.view'],
    '/org/unit/new': ['org_unit.unit.create'],
    '/org/unit/[id]': ['org_unit.unit.view'],
    '/org/unit/[id]/edit': ['org_unit.unit.update'],
    '/org/unit/[id]/history': ['org_unit.unit.view'],
    '/org/unit/create/audit': ['org_unit.unit.view'],
    '/org/config': ['org_unit.type.admin'],
    '/org/reports': ['org_unit.report.view'],
    '/org/assignments': ['org_unit.assignment.view'],
    '/org/assignments/new': ['org_unit.assignment.create'],
    '/org/assignments/[id]/edit': ['org_unit.assignment.update'],

    // TMS Routes
    '/tms/courses': ['tms.course.read'],
    '/tms/courses/new': ['tms.course.write'],
    '/tms/courses/[id]': ['tms.course.read'],
    '/tms/courses/[id]/edit': ['tms.course.write'],
    '/tms/courses/approval': ['tms.course.approve'],
    '/tms/programs': ['tms.program.read'],
    '/tms/programs/new': ['tms.program.write'],
    '/tms/programs/[id]': ['tms.program.read'],
    '/tms/programs/[id]/edit': ['tms.program.write'],
    '/tms/programs/review': ['tms.program.approve'],
    '/tms/syllabus': ['tms.syllabus.manage'],
    '/tms/instructors': ['tms.instructor.manage'],
};

// API routes permissions
const API_ROUTE_PERMISSIONS: Record<string, string[]> = {
    'GET:/api/hr/employees': ['hr.employees.view'],
    'POST:/api/hr/employees': ['hr.employees.create'],
    'PUT:/api/hr/employees/[id]': ['hr.employees.update'],
    'DELETE:/api/hr/employees/[id]': ['hr.employees.delete'],
    'GET:/api/hr/roles': ['hr.roles.view'],
    'POST:/api/hr/roles': ['hr.roles.create'],
    'PUT:/api/hr/roles/[id]': ['hr.roles.update'],
    'DELETE:/api/hr/roles/[id]': ['hr.roles.delete'],
    'GET:/api/hr/permissions': ['hr.permissions.view'],
    'POST:/api/hr/permissions': ['hr.permissions.create'],
    'PUT:/api/hr/permissions/[id]': ['hr.permissions.update'],
    'DELETE:/api/hr/permissions/[id]': ['hr.permissions.delete'],
    'GET:/api/hr/role-permissions': ['hr.role_permissions.view'],
    'POST:/api/hr/role-permissions': ['hr.role_permissions.create'],
    'DELETE:/api/hr/role-permissions/[id]': ['hr.role_permissions.delete'],
    'GET:/api/hr/user-roles': ['hr.user_roles.view'],
    'POST:/api/hr/user-roles': ['hr.user_roles.create'],
    'DELETE:/api/hr/user-roles/[id]': ['hr.user_roles.delete'],
    'GET:/api/hr/employee-logs': ['hr.employee_logs.view'],
    'GET:/api/hr/performance-reviews': ['hr.performance_reviews.view'],
    'POST:/api/hr/performance-reviews': ['hr.performance_reviews.create'],
    'GET:/api/hr/academic-titles': ['hr.academic_titles.view'],
    'POST:/api/hr/academic-titles': ['hr.academic_titles.create'],
    'PUT:/api/hr/academic-titles/[id]': ['hr.academic_titles.update'],
    'DELETE:/api/hr/academic-titles/[id]': ['hr.academic_titles.delete'],
    'GET:/api/hr/employee-academic-titles': ['hr.employee_academic_titles.view'],
    'POST:/api/hr/employee-academic-titles': ['hr.employee_academic_titles.create'],
    'PUT:/api/hr/employee-academic-titles/[id]': ['hr.employee_academic_titles.update'],
    'DELETE:/api/hr/employee-academic-titles/[id]': ['hr.employee_academic_titles.delete'],
    'GET:/api/hr/trainings': ['hr.trainings.view'],
    'POST:/api/hr/trainings': ['hr.trainings.create'],
    'PUT:/api/hr/trainings/[id]': ['hr.trainings.update'],
    'DELETE:/api/hr/trainings/[id]': ['hr.trainings.delete'],
    'GET:/api/hr/employee-trainings': ['hr.employee_trainings.view'],
    'POST:/api/hr/employee-trainings': ['hr.employee_trainings.create'],
    'PUT:/api/hr/employee-trainings/[id]': ['hr.employee_trainings.update'],
    'DELETE:/api/hr/employee-trainings/[id]': ['hr.employee_trainings.delete'],
    'GET:/api/hr/qualifications': ['hr.qualifications.view'],
    'POST:/api/hr/qualifications': ['hr.qualifications.create'],
    'PUT:/api/hr/qualifications/[id]': ['hr.qualifications.update'],
    'DELETE:/api/hr/qualifications/[id]': ['hr.qualifications.delete'],
    'GET:/api/hr/employee-qualifications': ['hr.employee_qualifications.view'],
    'POST:/api/hr/employee-qualifications': ['hr.employee_qualifications.create'],
    'PUT:/api/hr/employee-qualifications/[id]': ['hr.employee_qualifications.update'],
    'DELETE:/api/hr/employee-qualifications/[id]': ['hr.employee_qualifications.delete'],
    'GET:/api/hr/employments': ['hr.employments.view'],
    'POST:/api/hr/employments': ['hr.employments.create'],
    'PUT:/api/hr/employments/[id]': ['hr.employments.update'],
    'DELETE:/api/hr/employments/[id]': ['hr.employments.delete'],

    // Org API Routes - Units
    'GET:/api/org/units': ['org_unit.unit.view'],
    'POST:/api/org/units': ['org_unit.unit.create'],
    'GET:/api/org/units/[id]': ['org_unit.unit.view'],
    'PUT:/api/org/units/[id]': ['org_unit.unit.update'],
    'DELETE:/api/org/units/[id]': ['org_unit.unit.delete'],
    'GET:/api/org/units/audit': ['org_unit.unit.view'],
    'GET:/api/org/units/[id]/history': ['org_unit.unit.view'],
    'PUT:/api/org/units/[id]/status': ['org_unit.unit.update'],
    
    // Org API Routes - Unit Relations
    'GET:/api/org/unit-relations': ['org_unit.relation.view'],
    'POST:/api/org/unit-relations': ['org_unit.relation.create'],
    'GET:/api/org/unit-relations/[params]': ['org_unit.relation.view'],
    'PUT:/api/org/unit-relations/[params]': ['org_unit.relation.update'],
    'DELETE:/api/org/unit-relations/[params]': ['org_unit.relation.delete'],
    'GET:/api/org/unit-relations/by-key': ['org_unit.relation.view'],
    
    // Org API Routes - Types
    'GET:/api/org/types': ['org_unit.type.view'],
    'POST:/api/org/types': ['org_unit.type.create'],
    'GET:/api/org/types/[id]': ['org_unit.type.view'],
    'PUT:/api/org/types/[id]': ['org_unit.type.update'],
    'DELETE:/api/org/types/[id]': ['org_unit.type.delete'],
    'GET:/api/org/types/cached': ['org_unit.type.view'],
    
    // Org API Routes - Statuses
    'GET:/api/org/statuses': ['org_unit.status.view'],
    'POST:/api/org/statuses': ['org_unit.status.create'],
    'GET:/api/org/statuses/[id]': ['org_unit.status.view'],
    'PUT:/api/org/statuses/[id]': ['org_unit.status.update'],
    'DELETE:/api/org/statuses/[id]': ['org_unit.status.delete'],
    
    // Org API Routes - Assignments
    'GET:/api/org/assignments': ['org_unit.assignment.view'],
    'POST:/api/org/assignments': ['org_unit.assignment.create'],
    'GET:/api/org/assignments/[id]': ['org_unit.assignment.view'],
    'PUT:/api/org/assignments/[id]': ['org_unit.assignment.update'],
    'DELETE:/api/org/assignments/[id]': ['org_unit.assignment.delete'],
    
    // Org API Routes - Reports & Stats
    'GET:/api/org/stats': ['org_unit.report.view'],
    'GET:/api/org/reports': ['org_unit.report.view'],
    'GET:/api/org/campuses': ['org_unit.unit.view'],
    'GET:/api/org/user-units': ['org_unit.unit.view'],
    
    // Org API Routes - History
    'GET:/api/org/history': ['org_unit.unit.view'],
    'GET:/api/org/history/[id]': ['org_unit.unit.view'],
    
    // Org API Routes - Initial Units
    'GET:/api/org/initial-units': ['org_unit.unit.view'],
    'POST:/api/org/initial-units': ['org_unit.unit.create'],
    'GET:/api/org/request': ['org_unit.request.view'],
    
    // Org API Routes - Structure Requests
    'GET:/api/org/structure-requests': ['org_unit.request.view'],
    'POST:/api/org/structure-requests': ['org_unit.request.create'],
    'GET:/api/org/structure-requests/[id]': ['org_unit.request.view'],
    'PUT:/api/org/structure-requests/[id]': ['org_unit.request.update'],
    'DELETE:/api/org/structure-requests/[id]': ['org_unit.request.delete'],
    
    // Org API Routes - Unit Roles
    'GET:/api/org/unit-roles': ['org_unit.role.view'],
    'POST:/api/org/unit-roles': ['org_unit.role.create'],
    'GET:/api/org/unit-roles/[id]': ['org_unit.role.view'],
    'PUT:/api/org/unit-roles/[id]': ['org_unit.role.update'],
    'DELETE:/api/org/unit-roles/[id]': ['org_unit.role.delete'],

    // TMS API Routes
    'GET:/api/tms/courses': ['tms.course.read'],
    'POST:/api/tms/courses': ['tms.course.write'],
    'GET:/api/tms/courses/[id]': ['tms.course.read'],
    'PUT:/api/tms/courses/[id]': ['tms.course.write'],
    'DELETE:/api/tms/courses/[id]': ['tms.course.write'],
    'GET:/api/tms/programs': ['tms.program.read'],
    'POST:/api/tms/programs': ['tms.program.write'],
    'GET:/api/tms/programs/[id]': ['tms.program.read'],
    'PUT:/api/tms/programs/[id]': ['tms.program.write'],
    'PATCH:/api/tms/programs/[id]': ['tms.program.write'],
    'DELETE:/api/tms/programs/[id]': ['tms.program.write'],
    'GET:/api/tms/programs/stats': ['tms.program.read'],
};

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const method = req.method;

        console.log('🔒 Middleware triggered for:', method, pathname);

        // Kiểm tra quyền hạn cho API routes
        if (pathname.startsWith('/api/hr/') || pathname.startsWith('/api/org/') || pathname.startsWith('/api/tms/')) {
            const apiKey = `${method}:${pathname}`;
            const requiredPermissions = API_ROUTE_PERMISSIONS[apiKey];

            if (requiredPermissions && req.nextauth.token?.permissions) {
                const userPermissions = req.nextauth.token.permissions as string[];
                const hasPermission = requiredPermissions.some(permission =>
                    userPermissions.includes(permission)
                );

                if (!hasPermission) {
                    console.log('❌ Access denied - Missing permissions:', requiredPermissions);
                    return NextResponse.json(
                        { error: 'Access denied - Insufficient permissions' },
                        { status: 403 }
                    );
                }
            }
        }

        // Kiểm tra quyền hạn cho page routes
        const requiredPermissions = ROUTE_PERMISSIONS[pathname];
        if (requiredPermissions && req.nextauth.token?.permissions) {
            const userPermissions = req.nextauth.token.permissions as string[];
            const hasPermission = requiredPermissions.some(permission =>
                userPermissions.includes(permission)
            );

            if (!hasPermission) {
                console.log('❌ Access denied - Missing permissions:', requiredPermissions);
                console.log('User permissions:', userPermissions);
                console.log('Required permissions:', requiredPermissions);
                
                return NextResponse.redirect(new URL('/auth/signin', req.url));
            }
        }

        console.log('✅ Access granted');
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token, // Chỉ cho phép truy cập nếu đã đăng nhập
        },
    }
)

export const config = {
    matcher: [
        '/api/org/:path*',
        '/api/tms/:path*',
        '/org/:path*',
        '/tms/:path*',
        '/dashboard',
        '/employees/:path*',
        '/settings/:path*',
        '/profile/:path*',
        '/hr/:path*'
    ]
}