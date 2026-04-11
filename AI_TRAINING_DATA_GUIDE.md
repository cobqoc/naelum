# AI 모델 학습 데이터 수집 시스템

## 📋 개요

MobileNet 사전 학습 모델 대신, 사용자가 직접 라벨링한 데이터를 수집하여 향후 **한국 식재료 특화 커스텀 AI 모델**을 학습하는 시스템입니다.

---

## 🎯 목표

1. **고품질 학습 데이터 수집**: 사용자가 사진을 업로드하고 직접 재료명을 입력
2. **데이터 품질 관리**: 관리자 승인 시스템으로 학습 데이터 품질 보장
3. **개인정보 보호**: 사용자 동의 기반 데이터 수집

---

## 🗂️ 데이터베이스 구조

### `ingredient_training_data` 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 고유 ID |
| `user_id` | UUID | 사용자 ID |
| `image_url` | TEXT | Supabase Storage에 저장된 이미지 URL |
| `image_hash` | TEXT | 중복 방지용 이미지 해시 |
| `image_width` | INTEGER | 이미지 너비 (px) |
| `image_height` | INTEGER | 이미지 높이 (px) |
| `user_labels` | JSONB | **사용자가 라벨링한 재료 목록** (Ground Truth) |
| `training_status` | VARCHAR(20) | 학습 데이터 상태 |
| `quality_score` | INTEGER | 관리자 품질 점수 (1-5) |
| `admin_notes` | TEXT | 관리자 메모 |
| `consent_given` | BOOLEAN | 학습 데이터 사용 동의 |
| `photo_context` | VARCHAR(50) | 사진 컨텍스트 (raw, cooked, etc.) |
| `created_at` | TIMESTAMP | 생성 시간 |

### `user_labels` JSONB 구조 예시

```json
[
  {
    "name": "양파",
    "ingredientId": "uuid-123",
    "category": "veggie"
  },
  {
    "name": "토마토",
    "ingredientId": "uuid-456",
    "category": "veggie"
  }
]
```

### `training_status` 상태 값

- `pending`: 검토 대기 (기본값)
- `approved`: 학습 데이터로 승인됨
- `rejected`: 품질 문제로 거부됨
- `used`: 이미 학습에 사용됨

---

## 🔄 사용자 플로우

### 1. 사진 업로드
```
사용자 → 재료 관리 페이지 → "📷 사진으로 추가" 탭
```

### 2. 수동 라벨링
```
이미지 업로드 → 재료 이름 입력 (자동완성 지원) → 여러 재료 추가 가능
```

### 3. 데이터 저장
```
이미지 → Supabase Storage (ingredient-photos 버킷)
라벨 + 메타데이터 → ingredient_training_data 테이블
```

### 4. 사용자 재료 추가
```
라벨링한 재료 → user_ingredients 테이블에 자동 추가
```

---

## 🗄️ Supabase Storage 설정

### 버킷 생성 (Supabase 대시보드)

1. **버킷 이름**: `ingredient-photos`
2. **Public 설정**: `Private` (인증된 사용자만 업로드)
3. **File size limit**: `5MB`
4. **Allowed MIME types**: `image/jpeg`, `image/png`

### 버킷 정책 (RLS)

```sql
-- 사용자는 자신의 폴더에만 업로드 가능
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ingredient-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 사용자는 자신의 이미지만 조회 가능
CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ingredient-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 관리자는 모든 이미지 조회 가능
CREATE POLICY "Admins can view all images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ingredient-photos'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );
```

---

## 🔍 데이터 품질 관리

### 관리자 대시보드 (향후 구현)

```typescript
// 예시: 승인 대기 데이터 조회
const { data } = await supabase
  .from('ingredient_training_data')
  .select('*')
  .eq('training_status', 'pending')
  .order('created_at', { ascending: false });

// 데이터 승인
await supabase
  .from('ingredient_training_data')
  .update({
    training_status: 'approved',
    quality_score: 5,
    admin_notes: '고품질 데이터'
  })
  .eq('id', dataId);
```

### 품질 기준

- ✅ **승인 조건**:
  - 이미지가 선명하고 재료가 잘 보임
  - 라벨이 정확함 (오타 없음)
  - 적절한 조명과 배경

- ❌ **거부 조건**:
  - 이미지가 흐림 또는 재료 식별 불가
  - 라벨이 부정확하거나 오타가 많음
  - 부적절한 콘텐츠

---

## 📊 학습 데이터 추출

### 승인된 데이터만 추출

```sql
SELECT
  image_url,
  user_labels,
  image_width,
  image_height,
  quality_score
FROM ingredient_training_data
WHERE training_status = 'approved'
  AND consent_given = true
ORDER BY created_at DESC;
```

### Python으로 데이터 다운로드 (예시)

```python
import requests
import json
from supabase import create_client

# Supabase 클라이언트 생성
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 승인된 학습 데이터 조회
response = supabase.table('ingredient_training_data') \
    .select('*') \
    .eq('training_status', 'approved') \
    .eq('consent_given', True) \
    .execute()

# 이미지 다운로드 및 라벨 저장
for item in response.data:
    image_id = item['id']
    labels = item['user_labels']

    # 이미지 다운로드
    img_response = requests.get(item['image_url'])
    with open(f'data/{image_id}.jpg', 'wb') as f:
        f.write(img_response.content)

    # 라벨 저장
    with open(f'data/{image_id}.json', 'w') as f:
        json.dump(labels, f, ensure_ascii=False)
```

---

## 🤖 향후 커스텀 모델 학습 계획

### Phase 1: 데이터 수집 (현재)
- 목표: 1,000개 이상의 라벨링된 이미지
- 기간: 6개월

### Phase 2: 데이터 전처리
- 이미지 정규화 (크기, 밝기 조정)
- 데이터 증강 (회전, 플립, 밝기 변경)
- 학습/검증/테스트 세트 분리 (70/15/15)

### Phase 3: 모델 학습
- **베이스 모델**: MobileNet, EfficientNet, ResNet
- **Fine-tuning**: Transfer Learning
- **출력**: 한국 식재료 200+ 클래스 분류
- **성능 목표**: Top-1 Accuracy > 90%

### Phase 4: 모델 배포
- TensorFlow.js로 변환
- 기존 수동 라벨링 시스템 → AI 자동 인식 + 사용자 수정
- 계속해서 피드백 수집 및 재학습

---

## 📈 데이터 통계 조회 (SQL)

### 총 데이터 개수
```sql
SELECT
  training_status,
  COUNT(*) as count
FROM ingredient_training_data
GROUP BY training_status;
```

### 사용자별 기여도
```sql
SELECT
  user_id,
  COUNT(*) as uploads,
  SUM(CASE WHEN training_status = 'approved' THEN 1 ELSE 0 END) as approved
FROM ingredient_training_data
GROUP BY user_id
ORDER BY uploads DESC
LIMIT 10;
```

### 가장 많이 라벨링된 재료
```sql
SELECT
  jsonb_array_elements(user_labels)->>'name' as ingredient_name,
  COUNT(*) as count
FROM ingredient_training_data
WHERE training_status = 'approved'
GROUP BY ingredient_name
ORDER BY count DESC
LIMIT 20;
```

---

## 🔐 보안 및 개인정보 보호

### 사용자 동의
- 사진 업로드 시 "AI 모델 학습에 사용됩니다" 명시
- `consent_given` 필드로 추적

### 데이터 삭제 요청
사용자가 데이터 삭제를 요청하면:

```typescript
// 이미지 삭제
await supabase.storage
  .from('ingredient-photos')
  .remove([imageFileName]);

// DB 레코드 삭제 (Cascade로 자동 삭제됨)
await supabase
  .from('ingredient_training_data')
  .delete()
  .eq('id', dataId);
```

### RLS (Row Level Security)
- 사용자는 자신의 데이터만 조회/생성
- 관리자는 모든 데이터 조회 및 승인/거부 가능

---

## ✅ 체크리스트

### Supabase 설정
- [ ] Storage 버킷 `ingredient-photos` 생성
- [ ] 버킷 RLS 정책 설정
- [ ] `ingredient_training_data` 테이블 생성 (마이그레이션 실행)
- [ ] 관리자 계정 설정 (`role: 'admin'`)

### 프론트엔드
- [x] IngredientImageUpload 컴포넌트 구현
- [x] 자동완성 기능
- [x] 이미지 업로드 및 라벨링 UI

### 백엔드 (향후)
- [ ] 관리자 대시보드 페이지
- [ ] 데이터 승인/거부 API
- [ ] 학습 데이터 export API

---

## 📚 참고 자료

- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)
- [TensorFlow.js 문서](https://www.tensorflow.org/js)
- [Transfer Learning 가이드](https://www.tensorflow.org/tutorials/images/transfer_learning)

---

**업데이트**: 2026-02-12
**작성자**: 낼름 개발팀
