# AI Agent Instructions for User Registration System

## Project Architecture

This is a full-stack user registration system with these major components:

### Backend (NestJS)
- Located in `/backend/user-registation-api/`
- Uses MongoDB for data persistence
- Key modules:
  - `src/user.module.ts`: User registration and management
  - `src/app.module.ts`: Root application module
  - `src/main.ts`: Application bootstrap

### Frontend (React)
- Located in `/frontend/`
- Uses React with TypeScript
- Planned to use shadcn/ui components

## Development Workflows

### Backend Setup
```bash
cd backend/user-registation-api
npm install
npm run start:dev  # Starts development server on port 3000
```

### Environment Configuration
- MongoDB connection string should be in `.env` file
- Example configuration:
```env
MONGODB_URI=mongodb://localhost:27017/user-registration
```

## Key Patterns and Conventions

### API Endpoints
- All user-related endpoints are prefixed with `/user`
- Example: `/user/register` for user registration

### Data Transfer Objects (DTOs)
- Located in `src/*.dto.ts` files
- Use class-validator decorators for validation
- Example from `register.user.dto.ts`:
```typescript
@IsEmail()
email: string;

@IsString()
@MinLength(6)
password: string;
```

### Database Schema
- Mongoose schemas use `@nestjs/mongoose` decorators
- Always include `createdAt` timestamp
- Example schema pattern:
```typescript
@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;
}
```

## Integration Points

### Cross-Origin Resource Sharing (CORS)
- Backend configured to accept requests from frontend
- CORS settings in `main.ts`

### MongoDB Integration
- Uses Mongoose ODM through `@nestjs/mongoose`
- Schemas define data structure and validation

## Testing Patterns

### Backend Tests
```bash
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests
```

## Common Tasks

### Adding New API Endpoints
1. Create DTO in `src/*.dto.ts`
2. Add method to service class
3. Add controller endpoint
4. Update module imports if needed

### Database Operations
- Always use Mongoose models through dependency injection
- Handle duplicate key errors for unique fields
- Example pattern:
```typescript
@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
}
```

## Key Files for Reference
- `/backend/user-registation-api/src/user.module.ts`: User module configuration
- `/backend/user-registation-api/src/main.ts`: App configuration and bootstrap
- `/backend/user-registation-api/src/register.user.dto.ts`: User registration validation