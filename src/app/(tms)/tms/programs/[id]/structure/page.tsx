'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  CircularProgress,
  Alert,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { PictureAsPdf, TableChart } from '@mui/icons-material';

const ProgramStructurePage: React.FC = () => {
  const params = useParams();
  const programId = params.id as string;
  
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockMap, setBlockMap] = useState<Map<string, any>>(new Map());

  // Helper function to get prerequisites by type
  const getPrerequisitesByType = (prerequisites: any[]) => {
    if (!prerequisites || prerequisites.length === 0) {
      return { prerequisite: '-', prior: '-' };
    }
    
    const prerequisiteCourses = prerequisites
      .filter((prereq: any) => prereq.prerequisite_type === 'prerequisite')
      .map((prereq: any) => prereq.prerequisite_course.code);
    const priorCourses = prerequisites
      .filter((prereq: any) => prereq.prerequisite_type === 'prior')
      .map((prereq: any) => prereq.prerequisite_course.code);
    
    return {
      prerequisite: prerequisiteCourses.length > 0 ? prerequisiteCourses.join(', ') : '-',
      prior: priorCourses.length > 0 ? priorCourses.join(', ') : '-'
    };
  };

  // Export functions
  const exportToCSV = () => {
    if (!program) return;

    const csvData = [];
    
    // Add program header
    csvData.push(['KHUNG CHƯƠNG TRÌNH ĐÀO TẠO']);
    csvData.push([program.name_vi]);
    csvData.push([`Mã chương trình: ${program.code}`]);
    csvData.push([`Tổng số tín chỉ: ${program.total_credits}`]);
    csvData.push([]);
    csvData.push(['Mã môn', 'Tên môn học', 'TC', 'LT', 'TH', 'HP tiên quyết', 'HP học trước', 'Khối', 'Nhóm']);

    // Add course data
    Array.from(blockMap.entries())
      .sort(([aId, aData], [bId, bData]) => (aData.block.display_order || 0) - (bData.block.display_order || 0))
      .forEach(([blockId, blockData]) => {
        Array.from(blockData.groups.entries() as [string, any][]).forEach(([groupId, groupData]) => {
          groupData.courses
            .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
            .forEach((course: any) => {
              const prereqs = getPrerequisitesByType(course.prerequisites);
              csvData.push([
                course.code,
                course.name_vi,
                course.credits,
                course.theory_credit || 0,
                course.practical_credit || 0,
                prereqs.prerequisite,
                prereqs.prior,
                blockData.block.title,
                groupData.group.title
              ]);
            });
        });
      });

    // Convert to CSV string
    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    // Download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Khung_CTDT_${program.code}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // For PDF export, we'll use a simple approach with window.print()
    // In a production environment, you might want to use libraries like jsPDF or react-pdf
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Khung Chương Trình Đào Tạo - ${program?.name_vi}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .program-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .block-header { background-color: #e3f2fd; font-weight: bold; text-align: center; }
            .group-header { background-color: #f5f5f5; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KHUNG CHƯƠNG TRÌNH ĐÀO TẠO</h1>
            <h2>${program?.name_vi}</h2>
            <p>Mã chương trình: ${program?.code} | Tổng số tín chỉ: ${program?.total_credits}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Mã môn</th>
                <th>Tên môn học</th>
                <th>TC</th>
                <th>LT</th>
                <th>TH</th>
                <th>HP tiên quyết</th>
                <th>HP học trước</th>
                <th>Khối</th>
                <th>Nhóm</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from(blockMap.entries())
                .sort(([aId, aData], [bId, bData]) => (aData.block.display_order || 0) - (bData.block.display_order || 0))
                .map(([blockId, blockData]) => 
                  Array.from(blockData.groups.entries() as [string, any][]).map(([groupId, groupData]) =>
                    groupData.courses
                      .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                      .map((course: any) => {
                        const prereqs = getPrerequisitesByType(course.prerequisites);
                        return `
                          <tr>
                            <td>${course.code}</td>
                            <td>${course.name_vi}</td>
                            <td>${course.credits}</td>
                            <td>${course.theory_credit || 0}</td>
                            <td>${course.practical_credit || 0}</td>
                            <td>${prereqs.prerequisite}</td>
                            <td>${prereqs.prior}</td>
                            <td>${blockData.block.title}</td>
                            <td>${groupData.group.title}</td>
                          </tr>
                        `;
                      }).join('')
                  ).join('')
                ).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/tms/programs/${programId}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch program');
        }
        
        setProgram(result.data);
        
        // Build blockMap for export functions
        const newBlockMap = new Map<string, {
          block: any;
          groups: Map<string, any>;
        }>();

        result.data.ProgramCourseMap?.forEach((courseMap: any) => {
          const blockId = courseMap.ProgramBlock.id;
          const groupId = courseMap.ProgramBlockGroup.id;
          
          if (!newBlockMap.has(blockId)) {
            newBlockMap.set(blockId, {
              block: courseMap.ProgramBlock,
              groups: new Map()
            });
          }
          
          const blockData = newBlockMap.get(blockId)!;
          
          if (!blockData.groups.has(groupId)) {
            blockData.groups.set(groupId, {
              group: courseMap.ProgramBlockGroup,
              courses: []
            });
          }
          
          blockData.groups.get(groupId)!.courses.push({
            ...courseMap.Course,
            displayOrder: courseMap.display_order,
            prerequisites: courseMap.Course.prerequisites || []
          });
        });

        // Add parent group information
        Array.from(newBlockMap.values()).forEach(blockData => {
          Array.from(blockData.groups.values()).forEach(groupData => {
            if (groupData.group.parent_id) {
              const parentGroup = Array.from(newBlockMap.values())
                .flatMap(b => Array.from(b.groups.values()))
                .find(g => g.group.id === groupData.group.parent_id);
              
              if (parentGroup) {
                groupData.group.parent = parentGroup.group;
              }
            }
          });
        });

        setBlockMap(newBlockMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (programId) {
      fetchProgram();
    }
  }, [programId]);

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ px: 2 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth={false} sx={{ px: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!program) {
    return (
      <Container maxWidth={false} sx={{ px: 2 }}>
        <Alert severity="warning">Không tìm thấy chương trình</Alert>
      </Container>
    );
  }


  return (
    <Container maxWidth={false} sx={{ px: 2 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link href="/tms/programs" color="inherit">
          Chương trình đào tạo
        </Link>
        <Link href={`/tms/programs/${programId}`} color="inherit">
          {program.name_vi}
        </Link>
        <Typography color="text.primary">Khung chương trình</Typography>
      </Breadcrumbs>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {program.name_vi}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {program.code} • {program.total_credits} tín chỉ
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="Xuất CSV">
                <Button 
                  onClick={exportToCSV} 
                  variant="outlined" 
                  startIcon={<TableChart />}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  CSV
                </Button>
              </Tooltip>
              <Tooltip title="Xuất PDF">
                <Button 
                  onClick={exportToPDF} 
                  variant="contained" 
                  startIcon={<PictureAsPdf />}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  PDF
                </Button>
              </Tooltip>
            </Box>
          </Box>

          <Box mt={3}>
            {/* Single table header for all courses */}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small" sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '12%' }}>Mã môn</TableCell>
                    <TableCell sx={{ width: '42%' }}>Tên môn học</TableCell>
                    <TableCell align="center" sx={{ width: '8%' }}>TC</TableCell>
                    <TableCell align="center" sx={{ width: '8%' }}>LT</TableCell>
                    <TableCell align="center" sx={{ width: '8%' }}>TH</TableCell>
                    <TableCell sx={{ width: '12%' }}>HP tiên quyết</TableCell>
                    <TableCell sx={{ width: '10%' }}>HP học trước</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from(blockMap.entries())
                    .sort(([aId, aData], [bId, bData]) => (aData.block.display_order || 0) - (bData.block.display_order || 0))
                    .map(([blockId, blockData]) => (
                    <React.Fragment key={blockId}>
                                  {/* Block title row */}
                                  <TableRow sx={{ backgroundColor: 'primary.50' }}>
                                    <TableCell colSpan={7} sx={{ fontWeight: 'bold', color: 'primary.main', py: 2, textAlign: 'center', fontSize: '1.1rem' }}>
                                      {blockData.block.title}
                                    </TableCell>
                                  </TableRow>
                      
                      {/* Courses in this block */}
                      {(() => {
                        const parentGroups = new Map<string, any>();
                        const childGroups = new Map<string, any>();
                        
                        // Separate parent and child groups
                        Array.from(blockData.groups.entries() as [string, any][]).forEach(([groupId, groupData]) => {
                          if (groupData.group.parent_id) {
                            childGroups.set(groupId, groupData);
                          } else {
                            parentGroups.set(groupId, groupData);
                          }
                        });
                        
                        return (
                          <>
                            {/* Display parent groups first */}
                            {Array.from(parentGroups.entries()).map(([groupId, groupData]) => (
                              <React.Fragment key={groupId}>
                                {/* Parent group title row */}
                                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                                  <TableCell colSpan={7} sx={{ fontWeight: 'bold', py: 1.5, pl: 2 }}>
                                    {groupData.group.title}
                                  </TableCell>
                                </TableRow>
                                
                                {/* Display child groups under this parent */}
                                {Array.from(childGroups.entries())
                                  .filter(([_, childData]) => childData.group.parent_id === groupData.group.id)
                                  .sort(([aId, aData], [bId, bData]) => (aData.group.display_order || 0) - (bData.group.display_order || 0))
                                  .map(([childId, childData]) => (
                                  <React.Fragment key={childId}>
                                  {/* Child group title row */}
                                  <TableRow sx={{ backgroundColor: 'grey.25' }}>
                                    <TableCell colSpan={7} sx={{ fontWeight: 'medium', py: 1, pl: 4, color: 'text.secondary' }}>
                                      {childData.group.title}
                                    </TableCell>
                                  </TableRow>
                                    
                                    {/* Child group courses */}
                                    {childData.courses
                                      .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                                      .map((course: any) => (
                                      <TableRow key={course.id} sx={{ height: '48px' }}>
                                        <TableCell sx={{ width: '12%' }}>{course.code}</TableCell>
                                        <TableCell sx={{ width: '42%' }}>{course.name_vi}</TableCell>
                                        <TableCell align="center" sx={{ width: '8%' }}>{course.credits}</TableCell>
                                        <TableCell align="center" sx={{ width: '8%' }}>{course.theory_credit || 0}</TableCell>
                                        <TableCell align="center" sx={{ width: '8%' }}>{course.practical_credit || 0}</TableCell>
                                        <TableCell sx={{ width: '12%' }}>
                                          {(() => {
                                            const prereqs = getPrerequisitesByType(course.prerequisites);
                                            return prereqs.prerequisite;
                                          })()}
                                        </TableCell>
                                        <TableCell sx={{ width: '10%' }}>
                                          {(() => {
                                            const prereqs = getPrerequisitesByType(course.prerequisites);
                                            return prereqs.prior;
                                          })()}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </React.Fragment>
                                ))}
                                
                                {/* Display courses directly under parent group if any */}
                                {groupData.courses
                                  .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                                  .map((course: any) => (
                                  <TableRow key={course.id} sx={{ height: '48px' }}>
                                    <TableCell sx={{ width: '12%' }}>{course.code}</TableCell>
                                    <TableCell sx={{ width: '42%' }}>{course.name_vi}</TableCell>
                                    <TableCell align="center" sx={{ width: '8%' }}>{course.credits}</TableCell>
                                    <TableCell align="center" sx={{ width: '8%' }}>{course.theory_credit || 0}</TableCell>
                                    <TableCell align="center" sx={{ width: '8%' }}>{course.practical_credit || 0}</TableCell>
                                    <TableCell sx={{ width: '12%' }}>
                                      {(() => {
                                        const prereqs = getPrerequisitesByType(course.prerequisites);
                                        return prereqs.prerequisite;
                                      })()}
                                    </TableCell>
                                    <TableCell sx={{ width: '10%' }}>
                                      {(() => {
                                        const prereqs = getPrerequisitesByType(course.prerequisites);
                                        return prereqs.prior;
                                      })()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </React.Fragment>
                            ))}
                            
                            {/* Display orphan groups (groups without parent) */}
                            {Array.from(blockData.groups.entries() as [string, any][])
                              .filter(([_, groupData]) => !groupData.group.parent_id && !parentGroups.has(groupData.group.id))
                              .map(([groupId, groupData]) => (
                              <React.Fragment key={groupId}>
                              {/* Orphan group title row */}
                              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                                <TableCell colSpan={7} sx={{ fontWeight: 'bold', py: 1.5, pl: 2 }}>
                                  {groupData.group.title}
                                </TableCell>
                              </TableRow>
                                
                                {/* Orphan group courses */}
                                {groupData.courses
                                  .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                                  .map((course: any) => (
                                  <TableRow key={course.id} sx={{ height: '48px' }}>
                                    <TableCell sx={{ width: '12%' }}>{course.code}</TableCell>
                                    <TableCell sx={{ width: '42%' }}>{course.name_vi}</TableCell>
                                    <TableCell align="center" sx={{ width: '8%' }}>{course.credits}</TableCell>
                                    <TableCell align="center" sx={{ width: '8%' }}>{course.theory_credit || 0}</TableCell>
                                    <TableCell align="center" sx={{ width: '8%' }}>{course.practical_credit || 0}</TableCell>
                                    <TableCell sx={{ width: '12%' }}>
                                      {(() => {
                                        const prereqs = getPrerequisitesByType(course.prerequisites);
                                        return prereqs.prerequisite;
                                      })()}
                                    </TableCell>
                                    <TableCell sx={{ width: '10%' }}>
                                      {(() => {
                                        const prereqs = getPrerequisitesByType(course.prerequisites);
                                        return prereqs.prior;
                                      })()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </React.Fragment>
                            ))}
                          </>
                        );
                      })()}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ProgramStructurePage;