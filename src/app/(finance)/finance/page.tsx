'use client';

import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import {
  AttachMoney as AttachMoneyIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material'

type MajorOption = {
  id: string
  name: string
  code: string | null
  totalCreditsMin: number | null
  programs: { id: string | null; name: string | null; totalCredits: number | null }[]
}

type TuitionRate = {
  id: string
  academicYear: string
  perCreditFee: number
  currency: string
  totalCredits: number
  minTuition: number
  updatedAt: string
  major: { id: string; name: string }
  program: { id: string | null; name: string | null } | null
}

type MinTuitionRow = {
  tuitionRateId: string
  academicYear: string
  majorId: string
  majorName: string | null
  programId: string | null
  programName: string | null
  totalCreditsMin: number | null
  perCreditFee: number
  minTuition: number
  currency: string
}

type ToastState = { open: boolean; message: string; severity: 'success' | 'error' | 'info' }

const PRIMARY_GRADIENT = 'linear-gradient(135deg, #0f172a 0%, #0c4a6e 100%)'

const getCurrentAcademicYear = () => {
  const now = new Date()
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  return `${startYear}-${startYear + 1}`
}

const buildYearOptions = (range = 5) => {
  const current = getCurrentAcademicYear()
  const [start] = current.split('-').map(Number)
  return Array.from({ length: range }, (_, idx) => {
    const yearStart = start - idx
    return `${yearStart}-${yearStart + 1}`
  })
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || 'Đã xảy ra lỗi')
  }
  return response.json() as Promise<T>
}

export default function FinancePage() {
  const yearOptions = useMemo(() => buildYearOptions(6), [])
  const [academicYear, setAcademicYear] = useState(yearOptions[0])
  const [majors, setMajors] = useState<MajorOption[]>([])
  const [selectedMajor, setSelectedMajor] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [perCreditFee, setPerCreditFee] = useState('')
  const [note, setNote] = useState('')
  const [tuitionRates, setTuitionRates] = useState<TuitionRate[]>([])
  const [minTuitionList, setMinTuitionList] = useState<MinTuitionRow[]>([])
  const [historyLines, setHistoryLines] = useState<MinTuitionRow[]>([])
  const [loadingMajors, setLoadingMajors] = useState(false)
  const [loadingRates, setLoadingRates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const programOptions = useMemo(() => {
    return majors.find((major) => major.id === selectedMajor)?.programs ?? []
  }, [majors, selectedMajor])

  const selectedMajorInfo = useMemo(() => majors.find((major) => major.id === selectedMajor), [majors, selectedMajor])

  const fetchMajors = async () => {
    setLoadingMajors(true)
    try {
      const data = await fetchJSON<{ data: MajorOption[] }>('/api/finance/majors')
      setMajors(data.data)
      if (!selectedMajor && data.data.length > 0) {
        setSelectedMajor(data.data[0].id)
      }
    } catch (error) {
      console.error(error)
      setToast({ open: true, message: 'Không thể tải danh sách ngành', severity: 'error' })
    } finally {
      setLoadingMajors(false)
    }
  }

  const fetchTuitionRates = async () => {
    setLoadingRates(true)
    try {
      const query = new URLSearchParams({ year: academicYear })
      if (selectedMajor) query.set('majorId', selectedMajor)
      const data = await fetchJSON<{ data: TuitionRate[] }>(`/api/finance/tuition-rates?${query.toString()}`)
      setTuitionRates(data.data)
    } catch (error) {
      console.error(error)
      setToast({ open: true, message: 'Không thể tải đơn giá tín chỉ', severity: 'error' })
    } finally {
      setLoadingRates(false)
    }
  }

  const fetchMinTuition = async () => {
    try {
      const data = await fetchJSON<{ data: MinTuitionRow[] }>(`/api/finance/min-tuition?year=${academicYear}`)
      setMinTuitionList(data.data)
    } catch (error) {
      console.error(error)
      setToast({ open: true, message: 'Không thể tải bảng học phí tối thiểu', severity: 'error' })
    }
  }

  const fetchHistory = async () => {
    if (!selectedMajor) {
      setHistoryLines([])
      return
    }
    try {
      const data = await fetchJSON<{ data: MinTuitionRow[] }>(`/api/finance/min-tuition?majorId=${selectedMajor}&range=5`)
      setHistoryLines(data.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchMajors()
  }, [])

  useEffect(() => {
    fetchTuitionRates()
    fetchMinTuition()
  }, [academicYear, selectedMajor])

  useEffect(() => {
    fetchHistory()
  }, [selectedMajor])

  const stats = useMemo(() => {
    if (!minTuitionList.length) {
      return { programs: 0, avgTuition: 0, highest: 0 }
    }
    const programs = minTuitionList.length
    const avgTuition =
      minTuitionList.reduce((sum, row) => sum + row.minTuition, 0) / Math.max(1, programs)
    const highest = Math.max(...minTuitionList.map((row) => row.minTuition))
    return { programs, avgTuition, highest }
  }, [minTuitionList])

  const resetForm = () => {
    setPerCreditFee('')
    setNote('')
  }

  const submitTuitionRate = async (forceUpdate = false) => {
    const payload = {
      majorId: selectedMajor,
      programId: selectedProgram || undefined,
      academicYear,
      perCreditFee: Number(perCreditFee),
      note: note || undefined,
      force: forceUpdate,
    }

    const response = await fetch(`/api/finance/tuition-rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (response.status === 409) {
      const body = await response.json().catch(() => ({}))
      if (body.code === 'RATE_EXISTS' && !forceUpdate) {
        const confirmOverride = window.confirm('Đơn giá đã tồn tại. Bạn có muốn cập nhật lại không?')
        if (confirmOverride) {
          return submitTuitionRate(true)
        }
        throw new Error('Đã hủy cập nhật')
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody.error || 'Không thể lưu dữ liệu')
    }

    return response.json()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedMajor || !perCreditFee) {
      setToast({ open: true, message: 'Vui lòng chọn ngành và nhập đơn giá', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      await submitTuitionRate()
      setToast({ open: true, message: 'Cập nhật đơn giá thành công', severity: 'success' })
      resetForm()
      fetchTuitionRates()
      fetchMinTuition()
      fetchHistory()
    } catch (error) {
      console.error(error)
      setToast({ open: true, message: error instanceof Error ? error.message : 'Không thể lưu dữ liệu', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleProgramChange = (event: SelectChangeEvent<string>) => {
    setSelectedProgram(event.target.value)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          background: PRIMARY_GRADIENT,
          color: '#fff',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
          <Stack spacing={1}>
            <Typography variant="h4" fontWeight={700}>
              Trung tâm học phí
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Quản lý đơn giá tín chỉ, tự động tính học phí tối thiểu và theo dõi lịch sử cho từng CTĐT.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip label="Học phí" color="secondary" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff' }} />
              <Chip label="UC-4" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff' }} />
            </Stack>
          </Stack>
          <AttachMoneyIcon sx={{ fontSize: 80, opacity: 0.85 }} />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="overline" fontWeight={700} color="text.secondary">
                Tổng CTĐT có dữ liệu
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {stats.programs}
              </Typography>
              <Typography color="text.secondary">CTĐT đã công bố học phí tối thiểu năm {academicYear}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="overline" fontWeight={700} color="text.secondary">
                Học phí tối thiểu trung bình
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {stats.avgTuition.toLocaleString('vi-VN')} ₫
              </Typography>
              <Typography color="text.secondary">Trên mỗi CTĐT đã có đơn giá</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="overline" fontWeight={700} color="text.secondary">
                Học phí tối thiểu cao nhất
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {stats.highest.toLocaleString('vi-VN')} ₫
              </Typography>
              <Typography color="text.secondary">CTĐT có mức thu cao nhất năm {academicYear}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Thiết lập đơn giá tín chỉ
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Hoàn tất UC-4.1 — hệ thống sẽ tự động tính học phí tối thiểu và ghi log lịch sử cập nhật.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth required disabled={loadingMajors}>
                <InputLabel>Ngành/CTĐT</InputLabel>
                <Select
                  label="Ngành/CTĐT"
                  value={selectedMajor}
                  onChange={(event) => {
                    setSelectedMajor(event.target.value)
                    setSelectedProgram('')
                  }}
                >
                  {majors.map((major) => (
                    <MenuItem value={major.id} key={major.id}>
                      {major.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={!programOptions.length}>
                <InputLabel>Chương trình (tùy chọn)</InputLabel>
                <Select label="Chương trình (tùy chọn)" value={selectedProgram} onChange={handleProgramChange}>
                  <MenuItem value="">
                    <em>Tất cả CTĐT thuộc ngành</em>
                  </MenuItem>
                  {programOptions.map((program) => (
                    <MenuItem key={program.id ?? ''} value={program.id ?? ''}>
                      {program.name || 'CTĐT không tên'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Năm học</InputLabel>
                <Select label="Năm học" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Đơn giá / tín chỉ (VNĐ)"
                type="number"
                required
                value={perCreditFee}
                onChange={(event) => setPerCreditFee(event.target.value)}
                inputProps={{ min: 0 }}
              />

              <TextField
                label="Ghi chú"
                multiline
                minRows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    resetForm()
                  }}
                >
                  Xoá dữ liệu
                </Button>
                <Button type="submit" variant="contained" startIcon={<TrendingUpIcon />} disabled={saving || !selectedMajor}>
                  {saving ? 'Đang lưu...' : 'Cập nhật đơn giá'}
                </Button>
              </Stack>
            </Box>

            {selectedMajorInfo && (
              <Alert severity="info" sx={{ mt: 3 }}>
                Tín chỉ tối thiểu của ngành: <strong>{selectedMajorInfo.totalCreditsMin ?? '—'}</strong>
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>
                Lịch sử học phí 5 năm
              </Typography>
              <HistoryIcon color="primary" />
            </Stack>
            {historyLines.length === 0 ? (
              <Typography color="text.secondary">Chưa có dữ liệu lịch sử cho ngành này.</Typography>
            ) : (
              <Stack spacing={2} maxHeight={360} sx={{ overflow: 'auto', pr: 1 }}>
                {historyLines.map((item) => (
                  <Paper key={item.tuitionRateId} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Năm học {item.academicYear}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.programName || item.majorName}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={700}>
                        {item.minTuition.toLocaleString('vi-VN')} ₫
                      </Typography>
                    </Stack>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" spacing={2}>
                      <Chip label={`Đơn giá: ${item.perCreditFee.toLocaleString('vi-VN')} ₫`} size="small" />
                      <Chip
                        label={`Tổng tín chỉ: ${item.totalCreditsMin ?? '—'}`}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} mb={2}>
          <Typography variant="h6" fontWeight={700}>
            Danh sách học phí tối thiểu năm {academicYear}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { fetchTuitionRates(); fetchMinTuition(); }}>
              Làm mới
            </Button>
            <Button variant="contained" color="secondary" startIcon={<UploadFileIcon />}>
              Xuất Excel
            </Button>
          </Stack>
        </Stack>

        {loadingRates ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
            <Typography mt={2} color="text.secondary">
              Đang tải dữ liệu...
            </Typography>
          </Stack>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ngành / CTĐT</TableCell>
                <TableCell>Năm học</TableCell>
                <TableCell align="right">Đơn giá (₫)</TableCell>
                <TableCell align="right">Tổng tín chỉ</TableCell>
                <TableCell align="right">Học phí tối thiểu (₫)</TableCell>
                <TableCell>Ngày cập nhật</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tuitionRates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Chưa có dữ liệu học phí cho năm học này.
                  </TableCell>
                </TableRow>
              )}
              {tuitionRates.map((rate) => (
                <TableRow key={rate.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{rate.program?.name || rate.major.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ngành {rate.major.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{rate.academicYear}</TableCell>
                  <TableCell align="right">{rate.perCreditFee.toLocaleString('vi-VN')}</TableCell>
                  <TableCell align="right">{rate.totalCredits}</TableCell>
                  <TableCell align="right">{rate.minTuition.toLocaleString('vi-VN')}</TableCell>
                  <TableCell>{new Date(rate.updatedAt).toLocaleDateString('vi-VN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {toast && (
        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast((prev) => (prev ? { ...prev, open: false } : prev))}
        >
          <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  )
}
