# Skill Rates Feature - Quick Reference

## 🎯 What is the Dynamic Rating System?

The ADAA Employment system uses a **3-tier flexible pricing model** that allows different rates based on:

- **Skills** (e.g., Electrician, Plumber, Carpenter)
- **Time Scenarios** (e.g., Regular hours, Overtime, Night shift, Weekends, Holidays)
- **Context** (Project-specific or Employee-specific overrides)

## 📊 System Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ 1. RATE VARIANTS (Time-Based Scenarios)                │
│    Examples: Regular, Overtime, Night Shift, Weekend   │
│    One variant is marked as "Base Rate"                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. SKILL RATES (Default Pricing per Skill)             │
│    • Employee Rate: What we pay the worker             │
│    • Client Rate: What we charge the client            │
│    • Can be FLAT (e.g., 25 AED/hr) or                 │
│      MULTIPLIER (e.g., 1.5x base rate)                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. OVERRIDES (Optional)                                 │
│    • Project-specific rates (special client pricing)   │
│    • Employee-specific rates (senior/junior rates)     │
└─────────────────────────────────────────────────────────┘
```

## 🆕 New Features in Skill List

### 1. Rate Status Column

Shows at-a-glance whether rates are configured:

**🟢 Configured:**

```
┌──────────────────┐
│ 3 Rates Set      │  ← Green badge with count
│ Regular, Overtime│  ← First 2 variant names
└──────────────────┘
```

**🟡 Not Configured:**

```
┌──────────────────┐
│ Not Configured   │  ← Yellow badge
└──────────────────┘
```

### 2. Permission-Protected Actions

- Only users with `skill:update` can configure rates
- Only users with `skill:delete` can delete skills
- Buttons hidden for unauthorized users

### 3. Clear Button Labels

- ⚙️ Configure Rate Variants (tooltip on hover)
- ✏️ Edit Skill
- 🗑️ Delete Skill

## 🔧 How to Configure Skill Rates

### Step 1: Create Rate Variants (One-time Setup)

1. Go to **Rate Variants Management**
2. Create variants like:
   - Regular (mark as base rate) ✓
   - Overtime
   - Night Shift
   - Weekend
   - Holiday

### Step 2: Configure Skill Rates

1. Go to **Skill Management**
2. Find the skill you want to configure
3. Click the **⚙️ Configure Rates** button
4. For each rate variant:
   - Select the variant
   - Choose rate type (FLAT or MULTIPLIER)
   - Enter employee rate
   - Enter client rate
   - Add optional notes
5. Click **Save Rates**

### Example Configuration

**Skill: Electrician**

| Variant     | Type       | Employee Rate | Client Rate | Notes          |
| ----------- | ---------- | ------------- | ----------- | -------------- |
| Regular     | FLAT       | 20 AED/hr     | 35 AED/hr   | Standard hours |
| Overtime    | MULTIPLIER | 1.5x          | 1.5x        | >10 hours/day  |
| Night Shift | MULTIPLIER | 1.8x          | 2.0x        | 10pm-6am       |

**Calculated Rates:**

- Regular: Employee 20 AED/hr, Client 35 AED/hr
- Overtime: Employee 30 AED/hr (20 × 1.5), Client 52.5 AED/hr (35 × 1.5)
- Night Shift: Employee 36 AED/hr (20 × 1.8), Client 70 AED/hr (35 × 2.0)

## 💡 Rate Types Explained

### FLAT Rate

- Fixed amount per hour
- Example: 25 AED/hour
- Use for: Base rates, special fixed pricing

### MULTIPLIER Rate

- Multiplies the base rate
- Example: 1.5 (means 1.5x the base rate)
- Use for: Overtime, night shifts, premiums
- **Benefit:** Change base rate once, all multipliers update automatically

## 🎨 UI Improvements Summary

| Feature         | Before                       | After                       |
| --------------- | ---------------------------- | --------------------------- |
| Rate visibility | ❌ No indication             | ✅ Status column with badge |
| Button clarity  | ⚙️ Icon only                 | ⚙️ Icon + tooltip           |
| Permissions     | ❌ All users see all buttons | ✅ Role-based visibility    |
| Rate info       | ❌ Must open modal to check  | ✅ See status at a glance   |
| Updates         | ❌ Manual refresh needed     | ✅ Auto-updates after save  |

## 📱 Where Rates Are Used

1. **Timesheets** - Calculate employee pay based on hours and rate variant
2. **Project Billing** - Calculate client charges
3. **Cost Analysis** - Compare employee cost vs client revenue
4. **Reports** - Generate financial reports with accurate rates

## 🔍 Quick Troubleshooting

| Problem                    | Solution                                      |
| -------------------------- | --------------------------------------------- |
| "Not Configured" showing   | Click ⚙️ and configure at least the base rate |
| Multiplier not calculating | Ensure base rate exists and is FLAT type      |
| Can't see Configure button | Check you have `skill:update` permission      |
| Status not updating        | Clear browser cache or wait a moment          |

## 📚 Documentation Files

1. **RATE_SYSTEM_GUIDE.md** - Comprehensive system documentation
2. **IMPLEMENTATION_SUMMARY.md** - Technical implementation details
3. **SKILL_RATES_FEATURE_SUMMARY.md** - This quick reference

## 🚀 Initial Setup Checklist

- [ ] 1. Create rate variants (Regular, Overtime, Night Shift, Weekend, Holiday)
- [ ] 2. Mark one variant as base rate (typically "Regular")
- [ ] 3. Set display order and colors for each variant
- [ ] 4. Configure rates for each skill (at minimum, configure base rate)
- [ ] 5. Test rate calculations with sample data
- [ ] 6. Configure project-specific overrides as needed
- [ ] 7. Train team on the rate configuration workflow

## 💼 Business Benefits

✅ **Flexibility** - Different rates for different scenarios
✅ **Accuracy** - Precise billing and payroll
✅ **Efficiency** - Multipliers reduce manual updates
✅ **Transparency** - Clear rate visibility
✅ **Control** - Project and employee-specific overrides
✅ **Scalability** - Easy to add new rate variants

## 🎓 Best Practices

1. **Always configure base rate first** - Other rates depend on it
2. **Use multipliers for premiums** - Easier to maintain
3. **Add descriptive notes** - Document when rates apply
4. **Review rates quarterly** - Keep pricing competitive
5. **Document special rates** - Note why project/employee overrides exist

## 📞 Need Help?

- Check **RATE_SYSTEM_GUIDE.md** for detailed documentation
- Review **IMPLEMENTATION_SUMMARY.md** for technical details
- Contact system administrator for permission issues
- Submit feedback for feature improvements

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** ✅ Production Ready
