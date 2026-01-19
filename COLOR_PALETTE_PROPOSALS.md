# Đề Xuất Bảng Màu Cho Dự Án Video Conferencing

## Màu Hiện Tại
- **Primary**: `#FF6B35` (Orange/Coral) - đã được test và hoạt động tốt
- **Danger**: `#DF2721` (Red)
- **Success**: `#008081` (Teal)
- **Background**: Dark blue/gray tones

## Các Lựa Chọn Màu Primary Đề Xuất

### 1. **Orange/Coral (Hiện tại - #FF6B35)**
**Ưu điểm:**
- Warm, friendly, energetic
- Nổi bật trên dark background
- Dễ nhìn, không gây mỏi mắt
- Phù hợp với video conferencing (tạo cảm giác ấm áp, thân thiện)

**Nhược điểm:**
- Có thể hơi "trẻ con" nếu cần professional hơn

**Variations:**
- `#FF6B35` (hiện tại) - Coral orange
- `#F97316` - Vibrant orange
- `#FB923C` - Softer orange
- `#EA580C` - Deeper orange

---

### 2. **Blue (Professional)**
**Ưu điểm:**
- Professional, trustworthy
- Phù hợp với business/enterprise
- Dễ kết hợp với các màu khác

**Nhược điểm:**
- Có thể hơi "lạnh", ít nổi bật trên dark background

**Variations:**
- `#3B82F6` - Modern blue (Tailwind blue-500)
- `#0F70D7` - Deep blue (đã dùng trong chat)
- `#2563EB` - Bright blue
- `#1D4ED8` - Darker blue

---

### 3. **Purple/Violet (Modern, Creative)**
**Ưu điểm:**
- Modern, creative, unique
- Nổi bật, dễ nhận biết
- Phù hợp với tech/startup

**Nhược điểm:**
- Có thể không phù hợp với mọi ngành nghề

**Variations:**
- `#8B5CF6` - Vibrant purple
- `#6366F1` - Indigo (balanced)
- `#7C3AED` - Deep purple
- `#A855F7` - Bright purple

---

### 4. **Teal/Cyan (Fresh, Modern)**
**Ưu điểm:**
- Fresh, modern, clean
- Phù hợp với video/tech
- Dễ nhìn trên dark background

**Nhược điểm:**
- Có thể hơi "lạnh"

**Variations:**
- `#14B8A6` - Teal (Tailwind teal-500)
- `#06B6D4` - Cyan
- `#0891B2` - Deep cyan
- `#0D9488` - Darker teal

---

### 5. **Indigo (Balanced)**
**Ưu điểm:**
- Balanced giữa blue và purple
- Professional nhưng không quá lạnh
- Modern, versatile

**Nhược điểm:**
- Có thể không nổi bật như orange

**Variations:**
- `#6366F1` - Indigo (Tailwind indigo-500)
- `#4F46E5` - Deep indigo
- `#818CF8` - Light indigo

---

## Đề Xuất Của Tôi

### **Option 1: Giữ Orange (#FF6B35) - RECOMMENDED**
- Đã test và hoạt động tốt
- Warm, friendly, phù hợp với video conferencing
- Nổi bật trên dark background
- Tạo cảm giác ấm áp, thân thiện

**Bảng màu kèm theo:**
- Primary: `#FF6B35`
- Primary Hover: `#E55A2B` (darker)
- Primary Active: `#CC4F26` (darker)
- Primary Light: `#FF8C5A` (lighter)

---

### **Option 2: Indigo (#6366F1) - Modern & Professional**
- Balanced, professional nhưng không quá lạnh
- Modern, versatile
- Phù hợp với nhiều use cases

**Bảng màu kèm theo:**
- Primary: `#6366F1`
- Primary Hover: `#4F46E5`
- Primary Active: `#4338CA`
- Primary Light: `#818CF8`

---

### **Option 3: Teal (#14B8A6) - Fresh & Modern**
- Fresh, modern, clean
- Phù hợp với video/tech
- Dễ nhìn trên dark background

**Bảng màu kèm theo:**
- Primary: `#14B8A6`
- Primary Hover: `#0D9488`
- Primary Active: `#0F766E`
- Primary Light: `#2DD4BF`

---

## Cách Áp Dụng

Sau khi chọn màu, cần cập nhật:
1. `colorPrimary` trong `palette.js`
2. `btnPrimaryHoverBg` và `btnPrimaryActiveBg` (tính từ primary color)
3. Các hardcoded colors trong components (nếu có)
