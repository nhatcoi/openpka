# Phân tích sự khác biệt giữa OrgUnit.parent_id và OrgUnitRelation

## 1. Sự khác biệt

### OrgUnit.parent_id
- **Vị trí**: Field trực tiếp trong bảng `org.org_units`
- **Kiểu dữ liệu**: `BigInt?` (nullable)
- **Mục đích**: Quan hệ cha-con trực tiếp, đơn giản
- **Đặc điểm**:
  - ✅ Chỉ có thể có 1 parent tại một thời điểm
  - ✅ Không có hiệu lực theo thời gian (không có effective_from/effective_to)
  - ✅ Không có loại quan hệ (relation_type)
  - ✅ Không có ghi chú
  - ✅ Dễ query và hiển thị trong UI
  - ✅ Có foreign key constraint (nếu có)

### OrgUnitRelation
- **Vị trí**: Bảng riêng biệt `org.org_unit_relation`
- **Kiểu dữ liệu**: Composite key `[parent_id, child_id, relation_type, effective_from]`
- **Mục đích**: Quan hệ chi tiết, có lịch sử, linh hoạt
- **Đặc điểm**:
  - ✅ Có nhiều loại quan hệ (direct, advisory, support, collab)
  - ✅ Có hiệu lực theo thời gian (effective_from, effective_to)
  - ✅ Lịch sử quan hệ (có thể có nhiều records với effective dates khác nhau)
  - ✅ Có ghi chú (note)
  - ⚠️ Phức tạp hơn khi query
  - ⚠️ Không có foreign key constraint trực tiếp

## 2. Hiện trạng đồng bộ

### ❌ CHƯA ĐỒNG BỘ

**Khi tạo/cập nhật OrgUnitRelation:**
- Tạo relation với `relation_type = 'direct'` → **KHÔNG** tự động cập nhật `OrgUnit.parent_id`
- Chỉ tạo record trong `org_unit_relation` table

**Khi tạo/cập nhật OrgUnit:**
- Set `OrgUnit.parent_id` → **KHÔNG** tự động tạo `OrgUnitRelation`
- Chỉ cập nhật field `parent_id` trong `org_units` table

**Ví dụ:**
```typescript
// Tạo OrgUnit với parent_id
await db.orgUnit.create({
  data: {
    name: "Phòng A",
    parent_id: BigInt(1), // Parent ID = 1
    ...
  }
});
// → Chỉ có parent_id trong OrgUnit, KHÔNG có OrgUnitRelation

// Tạo OrgUnitRelation
await db.orgUnitRelation.create({
  data: {
    parent_id: BigInt(1),
    child_id: BigInt(2),
    relation_type: 'direct',
    effective_from: new Date(),
    ...
  }
});
// → Chỉ có OrgUnitRelation, KHÔNG cập nhật OrgUnit.parent_id
```

## 3. Vấn đề hiện tại

1. **Dữ liệu không nhất quán**: 
   - `OrgUnit.parent_id` có thể khác với `OrgUnitRelation` active
   - Dễ gây confusion khi hiển thị

2. **Query phức tạp**:
   - Phải query cả 2 nguồn dữ liệu để biết parent
   - UI phải check cả 2 nơi

3. **Validation ràng buộc**:
   - UC-1.7 đã check cả 2 nguồn nhưng không đồng bộ dữ liệu

## 4. Giải pháp đề xuất

### Option 1: Đồng bộ 2 chiều (Recommended)
**Khi tạo/cập nhật OrgUnitRelation với `relation_type = 'direct'`:**
- Nếu `effective_from <= now` và `(effective_to IS NULL OR effective_to >= now)` → Cập nhật `OrgUnit.parent_id`
- Nếu relation hết hiệu lực → Set `OrgUnit.parent_id = null`

**Khi tạo/cập nhật OrgUnit:**
- Khi set `OrgUnit.parent_id` → Tự động tạo/cập nhật `OrgUnitRelation` với `relation_type = 'direct'`, `effective_from = now`, `effective_to = null`

**Ưu điểm:**
- ✅ Dữ liệu luôn nhất quán
- ✅ Backward compatible
- ✅ Dễ query (có thể dùng `OrgUnit.parent_id` cho quick lookup)
- ✅ Có lịch sử trong `OrgUnitRelation`

**Nhược điểm:**
- ⚠️ Phải maintain logic đồng bộ ở nhiều nơi
- ⚠️ Có thể có race condition nếu không dùng transaction

### Option 2: Chỉ dùng OrgUnitRelation (Remove parent_id)
**Xóa field `parent_id` khỏi OrgUnit**, chỉ dùng `OrgUnitRelation`

**Ưu điểm:**
- ✅ Single source of truth
- ✅ Không lo đồng bộ

**Nhược điểm:**
- ❌ Breaking change lớn
- ❌ Phải migrate tất cả data
- ❌ Query phức tạp hơn (phải join với OrgUnitRelation)

### Option 3: Chỉ dùng OrgUnit.parent_id (Remove OrgUnitRelation)
**Xóa bảng `OrgUnitRelation`**, chỉ dùng `OrgUnit.parent_id`

**Ưu điểm:**
- ✅ Đơn giản
- ✅ Query nhanh

**Nhược điểm:**
- ❌ Mất tính linh hoạt (không có relation types, không có lịch sử, không có effective dates)
- ❌ Breaking change lớn

## 5. Khuyến nghị

**Chọn Option 1: Đồng bộ 2 chiều**

### Implementation Plan:

1. **Trong API `/api/org/unit-relations` (POST):**
   - Khi tạo relation với `relation_type = 'direct'` và relation đang active → Update `OrgUnit.parent_id`

2. **Trong API `/api/org/units/[id]` (PUT):**
   - Khi cập nhật `parent_id` → Tự động tạo/cập nhật `OrgUnitRelation` với `relation_type = 'direct'`

3. **Trong API `/api/org/unit-relations/[params]` (PUT/DELETE):**
   - Khi update/delete relation với `relation_type = 'direct'` → Recalculate và update `OrgUnit.parent_id` dựa trên active relations

4. **Trigger/Function để đồng bộ:**
   - Có thể tạo database trigger để tự động đồng bộ (optional, nhưng recommended)

### Logic đồng bộ:

```typescript
// Sync OrgUnitRelation → OrgUnit.parent_id
async function syncParentIdFromRelations(childId: BigInt) {
  const now = new Date();
  const activeDirectRelation = await db.orgUnitRelation.findFirst({
    where: {
      child_id: childId,
      relation_type: 'direct',
      effective_from: { lte: now },
      OR: [
        { effective_to: null },
        { effective_to: { gte: now } }
      ]
    },
    orderBy: { effective_from: 'desc' }
  });

  if (activeDirectRelation) {
    await db.orgUnit.update({
      where: { id: childId },
      data: { parent_id: activeDirectRelation.parent_id }
    });
  } else {
    await db.orgUnit.update({
      where: { id: childId },
      data: { parent_id: null }
    });
  }
}

// Sync OrgUnit.parent_id → OrgUnitRelation
async function syncRelationFromParentId(childId: BigInt, parentId: BigInt | null) {
  if (parentId) {
    // Tìm relation direct active hiện tại
    const now = new Date();
    const existingRelation = await db.orgUnitRelation.findFirst({
      where: {
        child_id: childId,
        parent_id: parentId,
        relation_type: 'direct',
        effective_from: { lte: now },
        OR: [
          { effective_to: null },
          { effective_to: { gte: now } }
        ]
      }
    });

    if (!existingRelation) {
      // Tạo relation mới
      await db.orgUnitRelation.create({
        data: {
          parent_id: parentId,
          child_id: childId,
          relation_type: 'direct',
          effective_from: now,
          effective_to: null,
          note: 'Tự động tạo từ OrgUnit.parent_id'
        }
      });
    }
  } else {
    // Kết thúc tất cả relations direct active
    const now = new Date();
    await db.orgUnitRelation.updateMany({
      where: {
        child_id: childId,
        relation_type: 'direct',
        effective_from: { lte: now },
        OR: [
          { effective_to: null },
          { effective_to: { gte: now } }
        ]
      },
      data: {
        effective_to: now
      }
    });
  }
}
```

## 6. Kết luận

- **Hiện tại**: OrgUnit.parent_id và OrgUnitRelation **KHÔNG được đồng bộ**
- **Đề xuất**: Implement Option 1 (Đồng bộ 2 chiều) để đảm bảo dữ liệu nhất quán
- **Priority**: Medium (nên làm để tránh confusion và data inconsistency)

