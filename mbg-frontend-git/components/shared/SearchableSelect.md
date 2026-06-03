# SearchableSelect Component

Komponen select dengan fitur pencarian seperti Select2 yang user-friendly.

## Fitur

- ✅ **Search**: User bisa mencari opsi dengan mengetik
- ✅ **Dropdown List**: Menampilkan semua opsi terlebih dahulu
- ✅ **Keyboard Navigation**: Arrow up/down, Enter, Escape
- ✅ **Clear Button**: Tombol X untuk clear selection
- ✅ **Description**: Setiap opsi bisa punya deskripsi tambahan
- ✅ **Loading State**: Disabled state untuk loading
- ✅ **Error State**: Menampilkan error message
- ✅ **Required Field**: Support validasi required

## Penggunaan

### Basic Usage

```tsx
import SearchableSelect from '@/components/shared/SearchableSelect';

<SearchableSelect
  label="Pilih Kategori"
  options={[
    { value: '1', label: 'Kategori A' },
    { value: '2', label: 'Kategori B' },
    { value: '3', label: 'Kategori C' }
  ]}
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  placeholder="-- Pilih Kategori --"
  required
/>
```

### With Description

```tsx
<SearchableSelect
  label="Pilih Produk"
  options={products.map(product => ({
    value: product.id,
    label: product.name,
    description: `Stok: ${product.stock} ${product.unit} • Rp ${product.price.toLocaleString()}`
  }))}
  value={selectedProduct}
  onChange={setSelectedProduct}
  searchPlaceholder="Cari produk..."
  emptyMessage="Tidak ada produk tersedia"
/>
```

### With Error State

```tsx
<SearchableSelect
  label="Pilih SPPG"
  options={sppgOptions}
  value={sppgId}
  onChange={setSppgId}
  error={errors.sppgId}
  required
/>
```

### Disabled State

```tsx
<SearchableSelect
  label="Pilih Komoditas"
  options={commodityOptions}
  value={commodityId}
  onChange={setCommodityId}
  disabled={isLoading}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | **Required** | Array of options |
| `value` | `string` | **Required** | Selected value |
| `onChange` | `(value: string) => void` | **Required** | Callback when value changes |
| `label` | `string` | - | Label text |
| `placeholder` | `string` | `'Pilih opsi...'` | Placeholder text |
| `searchPlaceholder` | `string` | `'Cari...'` | Search input placeholder |
| `emptyMessage` | `string` | `'Tidak ada data'` | Empty state message |
| `required` | `boolean` | `false` | Mark as required field |
| `disabled` | `boolean` | `false` | Disable the select |
| `error` | `string` | - | Error message |
| `className` | `string` | `''` | Additional CSS classes |

## SelectOption Interface

```typescript
interface SelectOption {
  value: string;
  label: string;
  description?: string; // Optional additional info
}
```

## Keyboard Shortcuts

- `Enter` / `Space` / `Arrow Down` - Open dropdown
- `Arrow Up` / `Arrow Down` - Navigate options
- `Enter` - Select highlighted option
- `Escape` - Close dropdown

## Contoh Implementasi

### 1. Product Selector (Stock IN/OUT)

```tsx
<SearchableSelect
  label="Pilih Produk"
  options={products.map(product => ({
    value: product.id,
    label: product.commodities.name,
    description: `Stok saat ini: ${product.stock} ${product.commodities.unit}`
  }))}
  value={form.supplier_product_id}
  onChange={(value) => setForm({ ...form, supplier_product_id: value })}
  placeholder="-- Pilih Produk --"
  searchPlaceholder="Cari produk..."
  emptyMessage="Tidak ada produk tersedia"
  required
/>
```

### 2. Category Selector (Product Create)

```tsx
<SearchableSelect
  options={categories.map(category => ({
    value: category.id,
    label: category.name
  }))}
  value={newCommodity.category_id}
  onChange={(value) => setNewCommodity({ ...newCommodity, category_id: value })}
  placeholder="-- Pilih Kategori --"
  searchPlaceholder="Cari kategori..."
  emptyMessage="Tidak ada kategori tersedia"
/>
```

### 3. SPPG Selector (Sales Transaction)

```tsx
<SearchableSelect
  label="Pilih SPPG"
  options={sppgs.map(sppg => ({
    value: sppg.id,
    label: sppg.name,
    description: sppg.address + (sppg.phone ? ` • 📞 ${sppg.phone}` : '')
  }))}
  value={selectedSppgId}
  onChange={setSelectedSppgId}
  placeholder="-- Pilih SPPG --"
  searchPlaceholder="Cari SPPG..."
  emptyMessage="Tidak ada SPPG tersedia"
  required
/>
```

### 4. Static Options (Payment Status)

```tsx
<SearchableSelect
  label="Status Pembayaran"
  options={[
    { value: 'pending', label: 'Pending' },
    { value: 'partial', label: 'Dibayar Sebagian' },
    { value: 'paid', label: 'Lunas' }
  ]}
  value={form.payment_status}
  onChange={(value) => setForm({ ...form, payment_status: value })}
  placeholder="-- Pilih Status --"
  searchPlaceholder="Cari status..."
/>
```

## Migration dari Select Biasa

**Sebelum:**
```tsx
<select
  value={categoryId}
  onChange={(e) => setCategoryId(e.target.value)}
  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
>
  <option value="">-- Pilih Kategori --</option>
  {categories.map((category) => (
    <option key={category.id} value={category.id}>
      {category.name}
    </option>
  ))}
</select>
```

**Sesudah:**
```tsx
<SearchableSelect
  options={categories.map(category => ({
    value: category.id,
    label: category.name
  }))}
  value={categoryId}
  onChange={setCategoryId}
  placeholder="-- Pilih Kategori --"
/>
```

## Styling

Component ini menggunakan Tailwind CSS dan sudah terintegrasi dengan tema aplikasi:
- Border colors: gray-300, blue-500 (focus), red-500 (error)
- Hover states: gray-50, gray-100
- Selected state: blue-100
- Icons: Tabler Icons (IconChevronDown, IconX, IconSearch)

## Accessibility

- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ ARIA labels (label element)
- ✅ Required field indicator
- ✅ Error message association
