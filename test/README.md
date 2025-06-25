# Test Suite

This folder contains testing utilities for the scrapd_in_Back project.

## 🧹 Linting & Formatting

### ESLint Configuration
- **File**: `.eslintrc.js`
- **Purpose**: Code quality and style enforcement
- **Rules**: TypeScript-specific rules, indentation, best practices

### Prettier Configuration
- **File**: `.prettierrc`
- **Purpose**: Code formatting and consistency
- **Settings**: 2-space indentation, single quotes, 80 char line width

### Available Commands
```bash
# Lint code for issues
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Run both lint and format
npm run lint:fix && npm run format
```

## 🔍 Duplicate Checker

### Purpose
The duplicate checker analyzes all database tables to identify duplicate records and potential data integrity issues.

### What It Checks
- **Author Table**: Name duplicates, LinkedIn URL duplicates
- **Content Table**: Content text duplicates
- **Email Table**: Email address duplicates
- **PhoneNumber Table**: Phone number duplicates
- **ContentEmail Table**: Relationship duplicates
- **AuthorEmail Table**: Relationship duplicates
- **AuthorPhone Table**: Relationship duplicates

### Usage
```bash
# Run duplicate check
npm run test:duplicates
```

### Output
1. **Console Summary**: Real-time progress and summary
2. **JSON Report**: Detailed report saved to `test/duplicate-report.json`

### Example Output
```
🔍 Starting duplicate check for all tables...

📊 Author: 2 duplicate issues found
  ❌ name: "John Doe" (3 occurrences)
  ❌ linkedInURL: "linkedin.com/in/johndoe" (2 occurrences)

📊 Email: 0 duplicate issues found
  ✅ No duplicates found

📋 DUPLICATE CHECK SUMMARY
==================================================
🎯 TOTAL DUPLICATE RECORDS: 3
⚠️  Duplicates found! Consider cleaning up the data.
```

### Files
- `duplicate-checker.ts`: Main duplicate checking logic
- `run-duplicate-check.ts`: Test runner script
- `duplicate-report.json`: Generated detailed report

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Format and lint code**:
   ```bash
   npm run format
   npm run lint:fix
   ```

3. **Check for duplicates**:
   ```bash
   npm run test:duplicates
   ```

## 📊 Database Schema Coverage

The duplicate checker covers all tables in your Prisma schema:
- ✅ Author
- ✅ Content  
- ✅ Email
- ✅ PhoneNumber
- ✅ ContentEmail
- ✅ AuthorEmail
- ✅ AuthorPhone

## 🔧 Customization

### Adding New Checks
To add checks for new tables, modify `duplicate-checker.ts`:
1. Add new method `checkNewTableDuplicates()`
2. Add to `checkAllTables()` method
3. Update the summary logic

### Modifying Linting Rules
Edit `.eslintrc.js` to customize:
- Indentation rules
- TypeScript strictness
- Import/export rules
- Custom project rules 