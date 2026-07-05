# Command Reference & Quick Actions

## 🎯 Quick Actions

### Start Development
```bash
npm run dev
```
Starts development server at `http://localhost:3000`

### Build for Production
```bash
npm run build
```
Builds optimized production bundle

### Start Production Server
```bash
npm run start
```
Starts production server (after build)

### Lint Code
```bash
npm run lint
```
Checks code quality and fixes issues

### Install Dependencies
```bash
npm install
```
Installs all required packages

### View Demo
```bash
# Visit http://localhost:3000/demo in your browser
```
See all new UI components in action

---

## 📂 File Navigation

### UI Components
```bash
cd components/ui/
# Contains all new UI components:
# - GlassCard.tsx
# - Button.tsx
# - Card.tsx
# - Field.tsx
# - Grid2.tsx
# - InfoBox.tsx
# - ReceiptTemplate.tsx
# - LeaseAgreementTemplate.tsx
```

### Utilities
```bash
cd utils/
# Contains helper functions:
# - formatters.ts (formatCurrency, numberToWords)
# - index.ts (currency formatting, date utilities)
```

### Documentation
```bash
# Read about Phase 2.1 implementation
cat PHASE_2.1_UI_ENHANCEMENT.md

# Follow migration guide
cat INTEGRATION_GUIDE.md

# See implementation summary
cat PHASE_2.1_COMPLETE.md

# Quick start reference
cat QUICK_START.md
```

### Demo Page
```bash
cd app/demo/
# Interactive component showcase
cat page.tsx
```

---

## 🔄 Common Operations

### Migrate Form Elements

**Find and replace all instances:**

```bash
# Replace div with GlassCard
# Search for: <div className="bg-white/5..."
# Replace with: <GlassCard>

# Replace standard inputs with Field
# Search for: <input type="text" className="..."
# Replace with: <Field
```

### Update Import Statements

```bash
# Add new imports to your pages
# Example:
import { GlassCard, Field, Button } from '@/components/ui';
import { formatCurrency, numberToWords } from '@/utils';
```

### Test Print Functionality

```bash
# Start dev server
npm run dev

# Visit your page and click print
# Test with: LeaseAgreementTemplate mode="print"

# Or use the demo
http://localhost:3000/demo
```

---

## 📊 Monitoring

### Check Component Usage

```bash
# Search for GlassCard usage
grep -r "GlassCard" app/

# Search for Field usage
grep -r "Field" app/

# Search for receipt template
grep -r "ReceiptTemplate" app/
```

### Check Dependencies

```bash
# View installed packages
npm list clsx tailwind-merge

# Check package.json
cat package.json
```

### Build & Test

```bash
# Clean build
npm run build

# Start production server
npm run start

# Run lint checks
npm run lint
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Import Errors**
```bash
# Restart dev server
npm run dev
```

**2. Styling Issues**
```bash
# Check Tailwind config
cat tailwind.config.ts

# Verify component is wrapped in GlassCard
```

**3. Print Not Working**
```bash
# Check browser print settings
# Test with Chrome/Edge for best results

# Ensure mode="print" is set
```

**4. TypeScript Errors**
```bash
# Run type checker
npx tsc --noEmit

# Check component exports
grep -r "export" components/ui/
```

---

## 📈 Performance Tips

### Code Splitting

```typescript
// Import components only when needed
const { GlassCard } = await import('@/components/ui');
```

### Lazy Loading

```typescript
// For large templates
const ReceiptTemplate = dynamic(
  () => import('@/components/ui/ReceiptTemplate'),
  { loading: () => <LoadingSpinner /> }
);
```

---

## 🎨 Customization

### Change Colors

```typescript
// In GlassCard.tsx, modify the base colors:
className="bg-white/5" // Change background opacity
className="border-white/10" // Change border opacity
```

### Customize Receipt

```typescript
// In ReceiptTemplate.tsx, modify:
settings.landlady_name // Change landlady name
settings.property_name // Change property name
```

### Modify Agreement Clauses

```typescript
// In LeaseAgreementTemplate.tsx, modify the <li> elements
// This is a complete template - customize freely
```

---

## 🚀 Deployment

### Build for Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Environment Variables

```bash
# Add these to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
PAYSTACK_SECRET_KEY=your_paystack_key
```

### Build Commands for Deployment

```bash
# Production build
npm run build

# Start production server
npm start
```

---

## 📚 Learning Resources

### Component Documentation
```bash
# Read detailed component docs
PHASE_2.1_UI_ENHANCEMENT.md

# Follow migration guide
INTEGRATION_GUIDE.md
```

### Example Code
```bash
# View interactive demo
app/demo/page.tsx

# See component usage
grep -A 20 "export default" app/apply/page.tsx
```

### Original Implementation
```bash
# Reference original components
cd ../PrinceSteve\ Residence_Original/components/
ls -la GlassCard.tsx LeaseAgreementTemplate.tsx ReceiptTemplate.tsx
```

---

## 🔄 Git Commands

### Create Branch for Migration

```bash
git checkout -b feature/migrate-to-ui-components
```

### Stage New Files

```bash
git add components/ui/
git add utils/formatters.ts
git add PHASE_2.1_*.md
```

### Commit Changes

```bash
git commit -m "feat: add Phase 2.1 UI components

- Add 8 premium UI components (GlassCard, Button, Field, etc.)
- Implement glassmorphism design system
- Add print-optimized templates
- Include comprehensive documentation"
```

### Create Pull Request

```bash
git push origin feature/migrate-to-ui-components
```

---

## 🎯 Next Steps

### Immediate
1. ✅ Review demo at `/demo`
2. ✅ Read `INTEGRATION_GUIDE.md`
3. ✅ Start migrating one page

### Short-term
1. ⏭️ Migrate all form pages
2. ⏭️ Update receipt displays
3. ⏭️ Add print functionality

### Long-term
1. 📅 Plan Phase 2.2 refactoring
2. 📅 Setup CI/CD pipeline
3. 📅 Add automated tests

---

## 📞 Support Channels

### Documentation
- **Phase 2.1**: `PHASE_2.1_UI_ENHANCEMENT.md`
- **Integration**: `INTEGRATION_GUIDE.md`
- **Summary**: `QUICK_START.md`

### Demo
- **Interactive**: `http://localhost:3000/demo`

### Code
- **Components**: `components/ui/`
- **Utilities**: `utils/`
- **Original**: `PrinceSteve Residence_Original/`

---

## 🎊 Success Checklist

- [ ] View demo at `/demo`
- [ ] Read documentation
- [ ] Understand component APIs
- [ ] Test components in development
- [ ] Migrate first page
- [ ] Test migration
- [ ] Deploy to staging
- [ ] Review performance
- [ ] Gather feedback
- [ ] Complete full migration

---

**Status**: ✅ Phase 2.1 Complete & Ready
**Next**: Migrate existing pages to new components
**Date**: July 2026