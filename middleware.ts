import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Định nghĩa quyền hạn cho từng route
const ROUTE_PERMISSIONS: Record<string, string[]> = {
    // HR Routes
    '/hr/dashboard': ['hr.view'],
    '/hr/employees': ['hr.employee.view'],
    '/hr/employees/new': ['hr.employee.create'],
    '/hr/employees/[id]/edit': ['hr.employee.update'],
    '/hr/assignments': ['hr.assignment.view'],
    '/hr/assignments/new': ['hr.assignment.create'],
    '/hr/assignments/[id]/edit': ['hr.assignment.update'],
    '/hr/assignments/[id]': ['hr.assignment.view'],
    '/hr/leave-requests': ['hr.leave_request.view'],
    '/hr/leave-requests/new': ['hr.leave_request.create'],
    '/hr/leave-requests/[id]': ['hr.leave_request.view'],
    '/hr/leave-requests/[id]/edit': ['hr.leave_request.update'],
    '/hr/performance-reviews': ['hr.performance_review.view'],
    '/hr/performance-reviews/new': ['hr.performance_review.create'],
    '/hr/performance-reviews/[id]/edit': ['hr.performance_review.update'],
    '/hr/evaluation-periods': ['hr.performance_review.view'],
    '/hr/qualifications': ['hr.qualification.view'],
    '/hr/qualifications/new': ['hr.qualification.create'],
    '/hr/qualifications/[id]/edit': ['hr.qualification.update'],
    '/hr/employee-qualifications': ['hr.qualification.view'],
    '/hr/employee-qualifications/new': ['hr.qualification.create'],
    '/hr/employee-qualifications/[id]/edit': ['hr.qualification.update'],
    '/hr/trainings': ['hr.training.view'],
    '/hr/trainings/new': ['hr.training.create'],
    '/hr/trainings/[id]/edit': ['hr.training.update'],
    '/hr/employee-trainings': ['hr.training.view'],
    '/hr/employee-trainings/new': ['hr.training.create'],
    '/hr/employee-trainings/[id]/edit': ['hr.training.update'],
    '/hr/academic-titles': ['hr.academic_title.view'],
    '/hr/academic-titles/new': ['hr.academic_title.create'],
    '/hr/academic-titles/[id]/edit': ['hr.academic_title.update'],
    '/hr/employee-academic-titles': ['hr.academic_title.view'],
    '/hr/employee-academic-titles/new': ['hr.academic_title.create'],
    '/hr/employee-academic-titles/[id]/edit': ['hr.academic_title.update'],
    '/hr/employments': ['hr.employment.view'],
    '/hr/employments/new': ['hr.employment.create'],
    '/hr/employments/[id]/edit': ['hr.employment.update'],
    '/hr/roles': ['hr.rbac.view'],
    '/hr/roles/new': ['hr.rbac.create'],
    '/hr/roles/[id]/edit': ['hr.rbac.update'],
    '/hr/permissions': ['hr.rbac.view'],
    '/hr/permissions/new': ['hr.rbac.create'],
    '/hr/permissions/[id]/edit': ['hr.rbac.update'],
    '/hr/role-permissions': ['hr.rbac.view'],
    '/hr/role-permissions/new': ['hr.rbac.create'],
    '/hr/user-roles': ['hr.rbac.view'],
    '/hr/user-roles/new': ['hr.rbac.create'],
    '/hr/employee-logs': ['hr.employee.view'],
    '/hr/reports': ['hr.report.view'],
    '/hr/profile': ['hr.employee.view'],
    '/hr/change-password': ['hr.employee.update'],

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
    '/tms/courses': ['tms.course.view'],
    '/tms/courses/new': ['tms.course.create'],
    '/tms/courses/[id]': ['tms.course.view'],
    '/tms/courses/[id]/edit': ['tms.course.update'],
    '/tms/courses/approval': ['tms.course.approve'],
    '/tms/programs': ['tms.program.view'],
    '/tms/programs/new': ['tms.program.create'],
    '/tms/programs/[id]': ['tms.program.view'],
    '/tms/programs/[id]/edit': ['tms.program.update'],
    '/tms/programs/review': ['tms.program.approve'],
    '/tms/majors': ['tms.major.view'],
    '/tms/majors/new': ['tms.major.create'],
    '/tms/majors/[id]': ['tms.major.view'],
    '/tms/majors/[id]/edit': ['tms.major.update'],
    '/tms/majors/review': ['tms.major.approve'],
    '/tms/reports': ['tms.report.view'],
};

// API routes permissions
const API_ROUTE_PERMISSIONS: Record<string, string[]> = {
    // HR API Routes - Employees
    'GET:/api/hr/employees': ['hr.employee.view'],
    'POST:/api/hr/employees': ['hr.employee.create'],
    'PUT:/api/hr/employees/[id]': ['hr.employee.update'],
    'DELETE:/api/hr/employees/[id]': ['hr.employee.delete'],
    
    // HR API Routes - Assignments
    'GET:/api/hr/assignments': ['hr.assignment.view'],
    'POST:/api/hr/assignments': ['hr.assignment.create'],
    'GET:/api/hr/assignments/[id]': ['hr.assignment.view'],
    'PUT:/api/hr/assignments/[id]': ['hr.assignment.update'],
    'DELETE:/api/hr/assignments/[id]': ['hr.assignment.delete'],
    
    // HR API Routes - Leave Requests
    'GET:/api/hr/leave-requests': ['hr.leave_request.view'],
    'POST:/api/hr/leave-requests': ['hr.leave_request.create'],
    'PUT:/api/hr/leave-requests/[id]': ['hr.leave_request.update'],
    'POST:/api/hr/leave-requests/[id]/approve': ['hr.leave_request.approve'],
    
    // HR API Routes - Performance Reviews
    'GET:/api/hr/performance-reviews': ['hr.performance_review.view'],
    'POST:/api/hr/performance-reviews': ['hr.performance_review.create'],
    'PUT:/api/hr/performance-reviews/[id]': ['hr.performance_review.update'],
    'POST:/api/hr/performance-reviews/[id]/approve': ['hr.performance_review.approve'],
    'GET:/api/hr/evaluation-periods': ['hr.performance_review.view'],
    'POST:/api/hr/evaluation-periods': ['hr.performance_review.create'],
    'GET:/api/hr/evaluation-urls': ['hr.performance_review.view'],
    'POST:/api/hr/evaluation-urls': ['hr.performance_review.create'],
    
    // HR API Routes - Qualifications
    'GET:/api/hr/qualifications': ['hr.qualification.view'],
    'POST:/api/hr/qualifications': ['hr.qualification.create'],
    'PUT:/api/hr/qualifications/[id]': ['hr.qualification.update'],
    'DELETE:/api/hr/qualifications/[id]': ['hr.qualification.delete'],
    'GET:/api/hr/employee-qualifications': ['hr.qualification.view'],
    'POST:/api/hr/employee-qualifications': ['hr.qualification.create'],
    'PUT:/api/hr/employee-qualifications/[id]': ['hr.qualification.update'],
    'DELETE:/api/hr/employee-qualifications/[id]': ['hr.qualification.delete'],
    
    // HR API Routes - Trainings
    'GET:/api/hr/trainings': ['hr.training.view'],
    'POST:/api/hr/trainings': ['hr.training.create'],
    'PUT:/api/hr/trainings/[id]': ['hr.training.update'],
    'DELETE:/api/hr/trainings/[id]': ['hr.training.delete'],
    'GET:/api/hr/employee-trainings': ['hr.training.view'],
    'POST:/api/hr/employee-trainings': ['hr.training.create'],
    'PUT:/api/hr/employee-trainings/[id]': ['hr.training.update'],
    'DELETE:/api/hr/employee-trainings/[id]': ['hr.training.delete'],
    
    // HR API Routes - Academic Titles
    'GET:/api/hr/academic-titles': ['hr.academic_title.view'],
    'POST:/api/hr/academic-titles': ['hr.academic_title.create'],
    'PUT:/api/hr/academic-titles/[id]': ['hr.academic_title.update'],
    'DELETE:/api/hr/academic-titles/[id]': ['hr.academic_title.delete'],
    'GET:/api/hr/employee-academic-titles': ['hr.academic_title.view'],
    'POST:/api/hr/employee-academic-titles': ['hr.academic_title.create'],
    'PUT:/api/hr/employee-academic-titles/[id]': ['hr.academic_title.update'],
    'DELETE:/api/hr/employee-academic-titles/[id]': ['hr.academic_title.delete'],
    
    // HR API Routes - Employments
    'GET:/api/hr/employments': ['hr.employment.view'],
    'POST:/api/hr/employments': ['hr.employment.create'],
    'PUT:/api/hr/employments/[id]': ['hr.employment.update'],
    'DELETE:/api/hr/employments/[id]': ['hr.employment.delete'],
    
    // HR API Routes - RBAC
    'GET:/api/hr/roles': ['hr.rbac.view'],
    'POST:/api/hr/roles': ['hr.rbac.create'],
    'PUT:/api/hr/roles/[id]': ['hr.rbac.update'],
    'DELETE:/api/hr/roles/[id]': ['hr.rbac.delete'],
    'GET:/api/hr/org-units': ['hr.assignment.view'],
    'GET:/api/hr/permissions': ['hr.rbac.view'],
    'POST:/api/hr/permissions': ['hr.rbac.create'],
    'PUT:/api/hr/permissions/[id]': ['hr.rbac.update'],
    'DELETE:/api/hr/permissions/[id]': ['hr.rbac.delete'],
    'GET:/api/hr/role-permissions': ['hr.rbac.view'],
    'POST:/api/hr/role-permissions': ['hr.rbac.create'],
    'DELETE:/api/hr/role-permissions/[id]': ['hr.rbac.delete'],
    'GET:/api/hr/user-roles': ['hr.rbac.view'],
    'POST:/api/hr/user-roles': ['hr.rbac.create'],
    'DELETE:/api/hr/user-roles/[id]': ['hr.rbac.delete'],
    
    // HR API Routes - Other
    'GET:/api/hr/employee-logs': ['hr.employee.view'],
    'GET:/api/hr/reports': ['hr.report.view'],

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

    // TMS API Routes - Courses
    'GET:/api/tms/courses': ['tms.course.view'],
    'POST:/api/tms/courses': ['tms.course.create'],
    'GET:/api/tms/courses/[id]': ['tms.course.view'],
    'PUT:/api/tms/courses/[id]': ['tms.course.update'],
    'DELETE:/api/tms/courses/[id]': ['tms.course.delete'],
    'POST:/api/tms/courses/[id]/approve': ['tms.course.approve'],
    'POST:/api/tms/courses/[id]/publish': ['tms.course.publish'],
    
    // TMS API Routes - Programs
    'GET:/api/tms/programs': ['tms.program.view'],
    'POST:/api/tms/programs': ['tms.program.create'],
    'GET:/api/tms/programs/[id]': ['tms.program.view'],
    'PUT:/api/tms/programs/[id]': ['tms.program.update'],
    'PATCH:/api/tms/programs/[id]': ['tms.program.update'],
    'DELETE:/api/tms/programs/[id]': ['tms.program.delete'],
    'GET:/api/tms/programs/stats': ['tms.program.view'],
    'POST:/api/tms/programs/[id]/approve': ['tms.program.approve'],
    'POST:/api/tms/programs/[id]/publish': ['tms.program.publish'],
    
    // TMS API Routes - Majors
    'GET:/api/tms/majors': ['tms.major.view'],
    'POST:/api/tms/majors': ['tms.major.create'],
    'GET:/api/tms/majors/[id]': ['tms.major.view'],
    'PUT:/api/tms/majors/[id]': ['tms.major.update'],
    'DELETE:/api/tms/majors/[id]': ['tms.major.delete'],
    'POST:/api/tms/majors/[id]/approve': ['tms.major.approve'],
    'POST:/api/tms/majors/[id]/publish': ['tms.major.publish'],
    
    // TMS API Routes - Reports
    'GET:/api/tms/reports': ['tms.report.view'],
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