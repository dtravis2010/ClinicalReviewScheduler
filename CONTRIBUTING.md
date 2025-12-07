# Contributing to Clinical Review Scheduler

Thank you for your interest in contributing to the Clinical Review Scheduler!

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Firebase account with Firestore configured
- Git

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/ClinicalReviewScheduler.git
cd ClinicalReviewScheduler

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Firebase credentials
nano .env

# Start development server
npm run dev
```

## Code Standards

### File Organization
- `/src/components` - Reusable React components
- `/src/pages` - Page-level components
- `/src/hooks` - Custom React hooks
- `/src/utils` - Utility functions
- `/src/constants` - Centralized constants
- `/src/schemas` - Zod validation schemas
- `/src/contexts` - React context providers

### Code Style
- Use functional components with hooks
- Add PropTypes to all components
- Use the centralized logger instead of console.*
- Use constants from `/src/constants` instead of magic strings
- Validate data with Zod schemas before Firebase operations

### Example Component
```javascript
import { useState } from 'react';
import PropTypes from 'prop-types';
import { logger } from '../utils/logger';
import { COLLECTIONS } from '../constants';

export default function MyComponent({ data, onUpdate }) {
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    try {
      setLoading(true);
      // ... save logic
      logger.info('Data saved successfully');
    } catch (error) {
      logger.error('Error saving data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    // ... JSX
  );
}

MyComponent.propTypes = {
  data: PropTypes.object.isRequired,
  onUpdate: PropTypes.func
};
```

## Git Workflow

### Branch Naming
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `refactor/` - Code refactoring

### Commit Messages
Follow the Conventional Commits specification:
```
feat: add employee productivity import
fix: resolve date comparison bug in DAR panel
docs: update README with deployment instructions
refactor: replace console calls with logger utility
```

### Pull Requests
1. Create a branch from `main`
2. Make your changes
3. Write/update tests if applicable
4. Update documentation
5. Submit PR with clear description
6. Wait for code review

## Testing

### Run Tests
```bash
npm test
```

### Add Tests
Place test files next to the component:
```
src/components/
  ├── MyComponent.jsx
  └── MyComponent.test.jsx
```

## Firebase Setup

### Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

### View Logs
```bash
firebase functions:log
```

## Common Tasks

### Adding a New Component
1. Create component file in appropriate directory
2. Add PropTypes validation
3. Import and use logger for errors
4. Use constants instead of magic strings
5. Add to relevant parent component

### Adding a New Firebase Collection
1. Add collection name to `/src/constants/index.js`
2. Create Zod schema in `/src/schemas/`
3. Add security rules in `firestore.rules`
4. Add indexes if needed in `firestore.indexes.json`
5. Deploy rules and indexes

### Debugging
- Check browser console for errors
- Use React DevTools for component inspection
- Use Firebase Console for data verification
- Check `logger` output in development mode

## Code Review Checklist
- [ ] PropTypes added to new components
- [ ] No console.* calls (use logger instead)
- [ ] Constants used instead of magic strings
- [ ] Validation with Zod schemas
- [ ] Error handling in async operations
- [ ] Loading states for user feedback
- [ ] Null checks before data access
- [ ] Comments for complex logic
- [ ] No security vulnerabilities

## Getting Help
- Check existing issues on GitHub
- Review documentation in `/docs`
- Ask questions in pull request comments

## License
By contributing, you agree that your contributions will be licensed under the project's license.
