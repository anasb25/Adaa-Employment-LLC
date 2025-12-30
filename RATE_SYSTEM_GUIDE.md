# Dynamic Skill-Based and Hour-Based Rating System

## Overview

The ADAA Employment system implements a sophisticated 3-tier dynamic rating structure that allows flexible pricing based on skills, time scenarios, and project requirements. This system replaces the legacy fixed `cost_price` and `sale_price` model with a more flexible rate variant system.

## System Architecture

### 1. Rate Variants (Time-Based Scenarios)

Rate Variants represent different time-based or scenario-based pricing conditions. Examples include:

- **Regular Hours** (Base Rate) - Standard working hours
- **Overtime** - Work beyond standard hours
- **Night Shift** - Work during night hours (e.g., 10pm-6am)
- **Weekend** - Work on weekends
- **Holiday** - Work on public holidays
- **Emergency** - Urgent/on-call work

**Key Properties:**

- `name`: Display name (e.g., "Overtime")
- `description`: Details about when this rate applies (e.g., ">10 hours per day")
- `isBaseRate`: Only ONE variant should be marked as base rate
- `displayOrder`: Controls UI sorting
- `isActive`: Enable/disable variants
- `color`: UI color coding for easy identification

**Management:**

- Navigate to **Rate Variants Management** page
- Create, edit, or delete rate variants
- Ensure exactly one variant is marked as base rate

### 2. Skill Rates (Skill-Level Pricing)

Each skill can have multiple rates configured, one for each rate variant. This defines the default pricing for that skill across all projects.

**Rate Types:**

- **FLAT**: Fixed amount per hour (e.g., 25 AED/hour)
- **MULTIPLIER**: Multiplier of the base rate (e.g., 1.5x for overtime)

**Dual Pricing:**

- **Employee Rate**: What the company pays the employee
- **Client Rate**: What the company charges the client

**Configuration:**

1. Go to **Skill Management**
2. Click the **Configure Rates** button (⚙️ icon) next to any skill
3. Add rates for different variants:
   - Base rate must be FLAT
   - Other rates can be FLAT or MULTIPLIER
4. Save configuration

**Example Configuration for "Electrician" Skill:**

```
Regular (Base):
  - Type: FLAT
  - Employee Rate: 20 AED/hr
  - Client Rate: 35 AED/hr

Overtime:
  - Type: MULTIPLIER
  - Employee Multiplier: 1.5 (= 30 AED/hr)
  - Client Multiplier: 1.5 (= 52.5 AED/hr)

Night Shift:
  - Type: MULTIPLIER
  - Employee Multiplier: 1.8 (= 36 AED/hr)
  - Client Multiplier: 2.0 (= 70 AED/hr)
```

### 3. Project Skill Rates (Project-Specific Overrides)

Projects can override the default skill rates with project-specific pricing. This is useful when:

- A client has negotiated special rates
- A project requires premium pricing
- Specific project conditions warrant different rates

**Configuration:**

1. Go to **Project Management**
2. Select a project and open **Skills** tab
3. Click **Configure Rates** for any assigned skill
4. Set project-specific rates (overrides skill-level rates)

**Note:** Project skill rates only have a single `rateValue` (client billing rate), as employee pay typically follows the skill-level configuration.

### 4. Employee Skill Rates (Employee-Specific Rates)

Individual employees can have custom rates for their skills, useful for:

- Senior/experienced employees earning higher rates
- Probationary employees earning lower rates
- Special contract arrangements

**Configuration:**

1. Go to **Employee Management**
2. Edit an employee and navigate to skills section
3. Configure employee-specific rates for their assigned skills

## Rate Calculation Logic

The system follows a hierarchical fallback approach:

```
1. Employee Skill Rate (if configured)
   ↓ (if not found)
2. Project Skill Rate (if configured)
   ↓ (if not found)
3. Skill Rate (default)
   ↓ (if not found)
4. Error: Rate not configured
```

### Multiplier Calculation

When a rate type is MULTIPLIER:

1. Find the base rate (where `isBaseRate = true`)
2. Multiply: `Final Rate = Base Rate × Multiplier`

**Example:**

- Base Rate: 20 AED/hr
- Overtime Multiplier: 1.5
- Final Overtime Rate: 20 × 1.5 = 30 AED/hr

## UI Features

### Skill List Enhancements

1. **Rate Status Column**: Shows if rates are configured

   - 🟢 "X Rates Set" - Rates configured (shows first 2 variant names)
   - 🟡 "Not Configured" - No rates set

2. **Configure Rates Button**: Quick access to rate configuration modal

3. **Permission Guards**: Only users with `skill:update` permission can configure rates

### Rate Configuration Modal

- **Visual Feedback**: Shows calculated final rates for multipliers
- **Validation**: Ensures base rate is always FLAT
- **Smart Defaults**: Auto-initializes with base rate variant
- **Bulk Operations**: Configure multiple variants at once

## Best Practices

### 1. Rate Variant Setup

- Create all rate variants before configuring skill rates
- Mark exactly ONE variant as base rate (typically "Regular Hours")
- Use descriptive names and descriptions
- Set logical display orders

### 2. Skill Rate Configuration

- Always configure at least the base rate for each skill
- Use MULTIPLIER for overtime/premium rates (easier to maintain)
- Add notes to clarify when rates apply (e.g., ">10 hours", "10pm-6am")
- Keep employee and client rates proportional

### 3. Project Overrides

- Only override when necessary (client-specific pricing)
- Document reasons in notes field
- Review project rates periodically

### 4. Employee Rates

- Use sparingly for special cases
- Document justification in employee records
- Review during performance reviews

## API Endpoints

### Skill Rates

```
GET    /skills/:id/rates                    - Get all rates for a skill
POST   /skills/:id/rates                    - Create/update a single rate
POST   /skills/:id/rates/bulk               - Bulk create/update rates
DELETE /skills/:id/rates/:rateVariantId     - Delete a rate
GET    /skills/:id/rates/:rateVariantId/calculate - Get calculated rate
```

### Rate Variants

```
GET    /rate-variants                       - Get all rate variants
POST   /rate-variants                       - Create rate variant
GET    /rate-variants/base                  - Get base rate variant
PATCH  /rate-variants/:id                   - Update rate variant
DELETE /rate-variants/:id                   - Delete rate variant
```

### Project Skill Rates

```
GET    /projects/:projectId/skills/:skillId/rates
POST   /projects/:projectId/skills/:skillId/rates/bulk
DELETE /projects/:projectId/skills/:skillId/rates/:rateVariantId
```

## Database Schema

### Key Tables

- `rate_variants` - Time-based rate scenarios
- `skill_rates` - Default skill pricing (employee + client rates)
- `project_skill_rates` - Project-specific overrides (client rates)
- `employee_skill_rates` - Employee-specific rates (employee rates)

### Relationships

```
Skill 1---* SkillRate *---1 RateVariant
Project 1---* ProjectSkillRate *---1 RateVariant
EmployeeSkill 1---* EmployeeSkillRate *---1 RateVariant
```

## System Architecture Notes

The dynamic rate variant system is the primary pricing mechanism:

1. **Rate Variants**: Define all time-based scenarios
2. **Skill Rates**: Configure rates for each skill-variant combination
3. **Overrides**: Use project/employee rates for special cases
4. **No Fallbacks**: Always configure at least the base rate for each skill

**Note:** Legacy `cost_price` and `sale_price` fields exist in the database schema but are deprecated and should not be used for new implementations. The rate variant system is the standard.

## Troubleshooting

### "Rate not configured" Error

- Ensure base rate is configured for the skill
- Check that rate variant exists and is active
- Verify project/employee overrides if applicable

### Multiplier Not Calculating

- Verify base rate exists and is marked as `isBaseRate = true`
- Ensure base rate is FLAT type
- Check that multiplier rate references correct variant

### Rates Not Updating in UI

- Clear browser cache
- Check query invalidation in code
- Verify API response includes `rateVariant` relation

## Future Enhancements

Potential improvements to consider:

- Time-based automatic rate selection (detect overtime hours)
- Rate templates for quick skill configuration
- Bulk rate updates across multiple skills
- Rate history and audit trail
- Rate comparison reports
- Integration with timesheet approval workflow

## Support

For questions or issues with the rate system:

1. Check this documentation
2. Review API endpoint documentation
3. Contact system administrator
4. Submit issue to development team
