# 🤝 Contributing to WhatsAI

Thank you for considering contributing to WhatsAI! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Project Structure](#-project-structure)
- [Coding Standards](#-coding-standards)
- [Commit Guidelines](#-commit-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [Issues and Bugs](#-issues-and-bugs)
- [Feature Requests](#-feature-requests)

---

## 📜 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Our Standards
- ✅ Using welcoming and inclusive language
- ✅ Being respectful of differing viewpoints and experiences
- ✅ Gracefully accepting constructive criticism
- ✅ Focusing on what is best for the community
- ✅ Showing empathy towards other community members

### Unacceptable Behavior
- ❌ Trolling, insulting/derogatory comments, and personal or political attacks
- ❌ Public or private harassment
- ❌ Publishing others' private information without explicit permission
- ❌ Other conduct which could reasonably be considered inappropriate in a professional setting

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Basic knowledge of TypeScript, React, and Node.js

### First Contribution
1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Write or update tests
5. Submit a pull request

### Types of Contributions
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🧪 Test coverage improvements

---

## 💻 Development Setup

### 1. Fork and Clone
```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/WhatsAI2.git
cd WhatsAI2

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/WhatsAI2.git
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Setup
```bash
# Copy environment files
cd server
cp .env.example .env

# Edit .env with development values
nano .env
```

### 4. Database Setup
```bash
cd server
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Start Development Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 6. Verify Setup
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Test page: http://localhost:3001/test

---

## 🏗️ Project Structure

```
WhatsAI2/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-specific components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS and styling
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── api/            # API routes and controllers
│   │   ├── config/         # Configuration files
│   │   ├── core/           # Core application logic
│   │   ├── database/       # Database and repositories
│   │   ├── services/       # Business logic services
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── scripts/            # Utility scripts
└── docs/                   # Documentation
```

### Key Directories

#### Frontend (`client/src/`)
- `components/`: Reusable UI components (Header, Footer, etc.)
- `features/`: Feature-specific components (auth, instances)
- `hooks/`: Custom React hooks for state management
- `pages/`: Top-level page components
- `types/`: TypeScript type definitions

#### Backend (`server/src/`)
- `api/`: Express routes, controllers, and middlewares
- `services/`: Business logic and external API integrations
- `database/`: Prisma client and repository pattern
- `core/`: Application initialization and configuration
- `utils/`: Shared utility functions

---

## 📝 Coding Standards

### TypeScript
```typescript
// ✅ Good - Use explicit types
interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  autoRefresh: number;
}

// ✅ Good - Use async/await
async function fetchUserData(id: string): Promise<User> {
  try {
    const user = await userRepository.findById(id);
    return user;
  } catch (error) {
    throw new AppError('User not found', 404);
  }
}

// ❌ Avoid - Using any type
function processData(data: any) {
  return data.something;
}
```

### React Components
```tsx
// ✅ Good - Functional component with TypeScript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  children,
  onClick,
  disabled = false
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// ✅ Good - Custom hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error storing value:', error);
    }
  };

  return [storedValue, setValue] as const;
};
```

### Backend Services
```typescript
// ✅ Good - Service class with dependency injection
export class InstanceService {
  constructor(
    private readonly instanceRepository: InstanceRepository,
    private readonly evolutionApiService: EvolutionApiService,
    private readonly socketService: SocketService
  ) {}

  async createInstance(data: CreateInstanceData): Promise<Instance> {
    // Validate input
    const validatedData = createInstanceSchema.parse(data);
    
    try {
      // Business logic
      const instance = await this.instanceRepository.create(validatedData);
      
      // External API call
      await this.evolutionApiService.createInstance(instance.name);
      
      // Real-time update
      this.socketService.emit('instanceCreated', instance);
      
      return instance;
    } catch (error) {
      throw new AppError('Failed to create instance', 500);
    }
  }
}
```

### Error Handling
```typescript
// ✅ Good - Custom error classes
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ✅ Good - Error middleware
export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};
```

### File Naming Conventions
- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Hooks: `camelCase.ts` (e.g., `useLocalStorage.ts`)
- Services: `kebab-case.ts` (e.g., `auth-service.ts`)
- Types: `kebab-case.ts` (e.g., `user-types.ts`)
- Utils: `kebab-case.ts` (e.g., `format-date.ts`)

---

## 📝 Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
# ✅ Good commit messages
feat(auth): add password reset functionality
fix(instances): resolve QR code generation issue
docs(api): update authentication endpoints documentation
refactor(services): extract common validation logic
test(auth): add unit tests for login service
chore(deps): update dependencies to latest versions

# ❌ Bad commit messages
update stuff
fix bug
WIP
```

### Scope Examples
- `auth`: Authentication features
- `instances`: WhatsApp instance management
- `ui`: User interface components
- `api`: Backend API changes
- `db`: Database changes
- `config`: Configuration changes

---

## 🔄 Pull Request Process

### Before Creating a PR
1. **Update your fork**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** following coding standards

4. **Test your changes**:
   ```bash
   # Run backend tests
   cd server && npm test
   
   # Run frontend tests
   cd client && npm test
   
   # Run integration tests
   npm run test:integration
   ```

5. **Update documentation** if needed

### Creating the PR
1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create pull request** on GitHub

3. **Fill out the PR template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Screenshots (if applicable)
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] Tests added/updated
   ```

### PR Review Process
1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Address feedback** if any
4. **Final approval** and merge

---

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and services
- **E2E Tests**: Complete user workflows
- **Manual Testing**: UI/UX validation

### Running Tests
```bash
# Backend unit tests
cd server
npm test

# Backend tests with coverage
npm run test:coverage

# Frontend tests
cd client
npm test

# Run all tests
npm run test:all

# E2E tests
npm run test:e2e
```

### Writing Tests

#### Backend Tests
```typescript
// Example service test
describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    } as any;
    
    authService = new AuthService(mockUserRepository);
  });

  it('should authenticate user with valid credentials', async () => {
    // Arrange
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    mockUserRepository.findByEmail.mockResolvedValue({
      id: '1',
      email,
      password: hashedPassword,
    });

    // Act
    const result = await authService.login(email, password);

    // Assert
    expect(result).toBeDefined();
    expect(result.user.email).toBe(email);
    expect(result.token).toBeDefined();
  });
});
```

#### Frontend Tests
```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <Button variant="primary" onClick={handleClick}>
        Click me
      </Button>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <Button variant="primary" disabled>
        Click me
      </Button>
    );
    
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Test Coverage
- Aim for **80%+ coverage** for new code
- **100% coverage** for critical business logic
- Use coverage reports to identify gaps

---

## 📚 Documentation

### Code Documentation
```typescript
/**
 * Creates a new WhatsApp instance
 * @param data - Instance creation data
 * @param data.name - Unique instance name
 * @param data.webhook - Webhook URL for callbacks
 * @returns Promise resolving to created instance
 * @throws {AppError} When instance name already exists
 * @throws {AppError} When Evolution API is unavailable
 */
async createInstance(data: CreateInstanceData): Promise<Instance> {
  // Implementation
}
```

### API Documentation
- Use JSDoc comments for all public methods
- Document request/response formats
- Include usage examples
- Document error scenarios

### README Updates
- Update feature lists when adding functionality
- Add configuration options
- Update installation instructions
- Include troubleshooting information

---

## 🐛 Issues and Bugs

### Before Reporting
1. **Search existing issues** to avoid duplicates
2. **Test with latest version**
3. **Check documentation** for solutions
4. **Gather relevant information**

### Bug Report Template
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Ubuntu 20.04]
- Node.js: [e.g., 18.17.0]
- Browser: [e.g., Chrome 115.0]
- WhatsAI Version: [e.g., 1.2.0]

## Additional Context
Screenshots, logs, or other relevant information
```

### Issue Labels
- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to docs
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `priority-high`: Critical issues
- `priority-low`: Nice to have

---

## ✨ Feature Requests

### Before Requesting
1. **Check existing feature requests**
2. **Consider the scope** and complexity
3. **Think about backwards compatibility**
4. **Consider implementation effort**

### Feature Request Template
```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternative Solutions
Other ways to solve this problem

## Additional Context
Mockups, examples, or other relevant information
```

### Feature Evaluation Criteria
- **Alignment** with project goals
- **User value** and demand
- **Implementation complexity**
- **Maintenance burden**
- **Backwards compatibility**

---

## 🏆 Recognition

### Contributors
All contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

### Contribution Types
- 💻 Code contributions
- 📖 Documentation
- 🐛 Bug reports
- 💡 Feature ideas
- 🎨 Design improvements
- 🔍 Code reviews
- 🌐 Translations

---

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Code Reviews**: Pull request feedback

### Response Times
- **Bug reports**: Within 48 hours
- **Feature requests**: Within 1 week
- **Pull requests**: Within 3 days
- **Security issues**: Within 24 hours

### Community Guidelines
- Be respectful and constructive
- Help others when possible
- Follow the code of conduct
- Share knowledge and best practices

---

Thank you for contributing to WhatsAI! Your help makes this project better for everyone. 🚀