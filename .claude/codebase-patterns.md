# Leverage BE — Codebase Patterns & Conventions

## Project Overview

NestJS 10 REST API with PostgreSQL (Supabase-hosted), TypeORM, and LangChain-based AI pipelines.

---

## Directory Structure

```
src/
├── main.ts                         # Bootstrap: port 8000, CORS, raw body for webhooks
├── app.module.ts                   # Root module, TypeORM config, all imports
├── app.controller.ts
├── app.service.ts
├── declarations/                   # NLP.js type declarations
├── migration/                      # TypeORM migrations (33 files)
├── modules/
│   ├── ai/                         # LangChain orchestration, multi-model support
│   ├── auditory/                   # AI audience analysis
│   ├── auth/                       # Supabase JWT + Passport.js
│   ├── checkout/                   # Stripe webhooks (raw body)
│   ├── competitors/                # AI competitor analysis
│   ├── config/                     # ORM config, audio config
│   ├── crypto/                     # Symmetric encryption
│   ├── plans/                      # Core domain (projects/phases/milestones/tasks)
│   │   ├── projects/
│   │   ├── phases/
│   │   ├── milestones/
│   │   ├── tasks/
│   │   ├── listeners/              # Event listeners for AI workflows
│   │   └── services/
│   ├── shaping/                    # AI idea discovery conversation
│   ├── subscriptions/              # Stripe payments, membership tiers
│   ├── supabase/                   # Supabase client & file storage
│   ├── text-to-speech/             # Deepgram TTS
│   ├── timeline/                   # Project timeline events
│   └── users/                      # User profiles linked to Supabase UUIDs
└── shared/
    ├── decorators/
    │   ├── auth.decorator.ts       # @AuthUser()
    │   └── custom-request.decorator.ts  # @CustomRequest(Pipe)
    ├── interceptors/
    │   └── timing.interceptor.ts   # Global request timing
    ├── pipes/
    │   └── zod-validation.pipe.ts  # ZodValidationPipe
    └── utils/
        ├── notReachable.ts         # Exhaustive switch helper
        ├── diffArrays.ts
        ├── shuffleArray.ts
        ├── emails.ts
        └── variables.ts
```

### Module Internal Structure Convention

Each module follows this pattern:

```
modules/{name}/
├── {name}.module.ts
├── controllers/
│   └── {name}.controller.ts
├── services/
│   ├── {name}.service.ts
│   └── {name}-ai.service.ts        # AI-specific logic (if applicable)
├── entities/
│   └── {name}.entity.ts
├── mappers/
│   └── map{Name}ToEntity.ts
├── pipes/
│   └── {name}-by-id.pipe.ts
├── listeners/                       # Event listeners (if applicable)
│   └── {event-name}.listener.ts
├── types/
│   └── entity.ts                    # Zod schemas + TS types
├── helpers/                         # Pure utility functions
└── prompts/                         # AI prompt templates (if applicable)
```

---

## Entity Patterns

### Standard Entity Template

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class MyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true, type: 'varchar' })
  optionalField: string | null;

  @Column({ nullable: false, type: 'varchar', default: 'draft' })
  status: MyStatus;

  @Column({ nullable: false, type: 'boolean', default: false })
  flagField: boolean;

  // Complex JSON objects
  @Column({ nullable: true, type: 'simple-json', default: null })
  jsonData: MyJsonType | null;

  // JSON arrays
  @Column({ type: 'simple-json', default: '[]' })
  items: MyItem[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

### Relations

```typescript
// Parent side (OneToMany)
@OneToMany(() => Child, (child) => child.parent, {
  onDelete: 'CASCADE',
  nullable: false,
})
children: Child[];

// Child side (ManyToOne)
@Index()
@Column({ nullable: false })
parentId: string;

@ManyToOne(() => Parent, (parent) => parent.children, {
  onDelete: 'CASCADE',
  nullable: false,
})
parent: Parent;
```

### Special: User Entity (Supabase UUID)

```typescript
@Entity()
export class User {
  @PrimaryColumn() // NOT @PrimaryGeneratedColumn — linked to Supabase UUID
  id: string;

  @Column({ nullable: false })
  email: string;

  @Column({
    nullable: false,
    type: 'enum',
    enum: SUBSCRIPTION_TYPES,
    default: 'basic',
  })
  subscription: SubscriptionType;
  // ...
}
```

### Existing Entities (9 total)

1. `Project` — plans/projects/entities/project.entity.ts
2. `Phase` — plans/phases/entities/phase.entity.ts
3. `Milestone` — plans/milestones/entities/milestone.entity.ts
4. `Task` — plans/tasks/entities/task.entity.ts
5. `Shaping` — shaping/entities/shaping.entity.ts
6. `User` — users/entities/user.entity.ts
7. `TimelinePoint` — timeline/entities/timeline-point.entity.ts
8. `Competitor` — competitors/entities/competitor.entity.ts
9. `Auditory` — auditory/entities/auditory.entity.ts

---

## Type & Validation Patterns

### Zod Schema + TypeScript Inference

```typescript
// In types/entity.ts
import { z } from 'zod';

export const CREATE_MY_ENTITY_SCHEMA = z.object({
  name: z.string().trim(),
  description: z.string().trim().nullable(),
  url: z
    .string()
    .trim()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .refine((val) => val === null || z.string().url().safeParse(val).success, {
      message: 'Invalid URL',
    }),
});

export type MyEntityCreateData = z.infer<typeof CREATE_MY_ENTITY_SCHEMA>;
```

### Status Union Types

```typescript
export type ProjectStatus =
  | 'draft'
  | 'shaping'
  | 'soulBuilding'
  | 'soulError'
  | 'soulDone'
  | 'analyzing'
  | 'active'
  | 'completed'
  | 'onHold'
  | 'cancelled';
```

### Const Arrays for Enums

```typescript
export const SUBSCRIPTION_TYPES = ['basic', 'pro', 'business'] as const;
export type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[number];
```

### Response Entity Types (what controllers return)

```typescript
export type ProjectEntity = {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  // ... only fields the client needs
};
```

---

## Controller Patterns

### Standard Controller

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { AuthUser } from '../../../shared/decorators/auth.decorator';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation.pipe';

@Controller('my-entities')
@UseGuards(JwtAuthGuard)
export class MyEntitiesController {
  constructor(private readonly myService: MyService) {}

  @Get()
  async getAll(@AuthUser() user: User) {
    const items = await this.myService.getAll(user.id);
    return items.map(mapMyEntityToResponse);
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string, @AuthUser() user: User) {
    const item = await this.myService.getOneByIdOrThrow(id);
    if (item.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }
    return mapMyEntityToResponse(item);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(CREATE_SCHEMA)) data: CreateData,
    @AuthUser() user: User,
  ) {
    const item = await this.myService.create({ ...data, userId: user.id });
    return mapMyEntityToResponse(item);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UPDATE_SCHEMA)) data: UpdateData,
    @AuthUser() user: User,
  ) {
    const item = await this.myService.getOneByIdOrThrow(id);
    if (item.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }
    const updated = await this.myService.update({ ...item, ...data });
    return mapMyEntityToResponse(updated);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string, @AuthUser() user: User) {
    const item = await this.myService.getOneByIdOrThrow(id);
    if (item.userId !== user.id) {
      throw new UnauthorizedException('Permissions denied');
    }
    return this.myService.softDelete(id);
  }
}
```

### Key Controller Decorators

```typescript
// Auth user from JWT
@AuthUser() user: User

// DB user via custom pipe (fetches/creates user in DB)
@CustomRequest(UserPipe) user: User

// Entity loaded from DB by param pipe
@Param('projectId', ProjectByIdPipe) project: Project
@Param('projectId', ActiveProjectByIdPipe) project: Project  // + validates activated

// Zod validation
@Body(new ZodValidationPipe(MY_SCHEMA)) data: MyData

// UUID validation
@Param('id', ParseUUIDPipe) id: string
```

### Ownership Check Pattern

```typescript
if (entity.userId !== user.id) {
  throw new UnauthorizedException('Permissions denied');
}
```

---

## Service Patterns

### Standard CRUD Service

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MyService {
  constructor(
    @InjectRepository(MyEntity)
    private readonly repository: Repository<MyEntity>,
  ) {}

  async create(
    data: Omit<MyEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MyEntity> {
    return this.repository.save(data);
  }

  async createMany(
    data: Array<Omit<MyEntity, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<MyEntity[]> {
    return this.repository.save(data);
  }

  async update(data: MyEntity): Promise<MyEntity> {
    return this.repository.save(data);
  }

  async updatePartial(id: string, data: Partial<MyEntity>) {
    return this.repository.update(id, data);
  }

  async getAll(userId: string) {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOneById(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  async getOneByIdOrThrow(id: string) {
    const entity = await this.getOneById(id);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }
    return entity;
  }

  async softDelete(id: string) {
    return this.repository.softDelete(id);
  }
}
```

### Service with Events

```typescript
@Injectable()
export class MyService {
  constructor(
    @InjectRepository(MyEntity)
    private readonly repository: Repository<MyEntity>,
    private eventEmitter: EventEmitter2,
  ) {}

  async activate(id: string) {
    const result = await this.updatePartial(id, { status: 'active' });
    this.eventEmitter.emit('my-entity.activated', { id });
    return result;
  }
}
```

### AI Service Pattern

```typescript
import { Injectable } from '@nestjs/common';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { getModel } from '../../ai/models/models';

@Injectable()
export class MyAiService {
  async generateStructured(input: MyInput): Promise<MyOutput> {
    const model = getModel('claude-sonnet-4-6', 0.3);
    const structuredModel = model.withStructuredOutput<MyOutput>(
      MY_OUTPUT_SCHEMA, // Zod schema
      { name: 'MyOutput' },
    );

    return structuredModel.invoke([
      new SystemMessage('System prompt here'),
      new HumanMessage(`Input data: ${JSON.stringify(input)}`),
    ]);
  }
}
```

---

## Module Patterns

### Standard Module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([MyEntity]),
    UsersModule, // For UserPipe
    SupabaseModule, // For storage
  ],
  controllers: [MyController],
  providers: [MyService, MyAiService],
  exports: [MyService],
})
export class MyModule {}
```

### Module with Circular Dependencies

```typescript
import { Module, forwardRef } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([MyEntity]),
    forwardRef(() => OtherModule), // Break circular dependency
  ],
  // ...
})
export class MyModule {}
```

### Module with Event Listeners

```typescript
@Module({
  providers: [
    MyService,
    MyEventListener, // Register as provider
  ],
})
export class MyModule {}
```

### Registering in AppModule

New entities must be added to the TypeORM entities array in `app.module.ts`:

```typescript
entities: [Project, Shaping, Phase, Milestone, Task, User, TimelinePoint, Competitor, Auditory, NewEntity],
```

And the module imported:

```typescript
imports: [
  // ... existing modules
  NewModule,
],
```

---

## Event System

### Configuration (in app.module.ts)

```typescript
EventEmitterModule.forRoot({
  wildcard: true,
  delimiter: '.',
  maxListeners: 10,
  verboseMemoryLeak: true,
  ignoreErrors: false,
}),
```

### Event Naming Convention

Dot-delimited namespace: `{entity}.{action}`

- `project.shaping.started`
- `project.started`
- `project.completed`
- `phase.createdForProject`
- `phase.updatedForProject`

### Listener Pattern

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class MyEventListener {
  constructor(
    private readonly myService: MyService,
    private readonly aiService: MyAiService,
  ) {}

  @OnEvent('my-entity.created')
  async handleCreated({ entityId }: { entityId: string }) {
    // React to event asynchronously
  }
}
```

---

## Mapper Patterns

```typescript
// mappers/mapMyEntityToEntity.ts
export const mapMyEntityToResponse = (entity: MyEntity): MyEntityResponse => ({
  id: entity.id,
  name: entity.name,
  status: entity.status,
  createdAt: entity.createdAt,
  // Only include fields the client needs
});
```

---

## Custom Pipe Patterns

### Entity Loader Pipe

```typescript
@Injectable()
export class MyEntityByIdPipe implements PipeTransform {
  constructor(private readonly myService: MyService) {}

  async transform(id: string): Promise<MyEntity> {
    const entity = await this.myService.getOneById(id);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }
    return entity;
  }
}
```

### UserPipe (creates user if not exists)

```typescript
@Injectable()
export class UserPipe implements PipeTransform<AuthRequest, Promise<User>> {
  constructor(private readonly usersService: UsersService) {}

  async transform(request: AuthRequest) {
    if (!request.user.email) {
      throw new UnauthorizedException({
        cause: 'invalid_Auth_request',
        description: 'User email is missing',
      });
    }
    let user = await this.usersService.findOneByEmail(request.user.email);
    if (!user) {
      user = await this.usersService.create({
        email: request.user.email,
        id: request.user.id,
        subscription: 'business',
      });
    }
    return user;
  }
}
```

---

## Auth Flow

1. Client authenticates with Supabase directly
2. Client sends JWT as Bearer token
3. `JwtStrategyService` validates with `SUPABASE_JWT_SECRET` (HS256)
4. `supabase.auth.getUser()` confirms user exists and is not anonymous
5. `@AuthUser()` extracts Supabase user object
6. `@CustomRequest(UserPipe)` fetches/creates DB `User` entity

### Applying Auth to Controller

```typescript
@Controller('my-route')
@UseGuards(JwtAuthGuard) // Class-level guard
export class MyController {}
```

---

## Migration Patterns

### Creating a Migration

```bash
npm run typeorm migration:generate -- src/migration/MigrationName
```

### Migration Structure

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationName1234567890 implements MigrationInterface {
  name = 'MigrationName1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "my_entity" ADD "newColumn" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "my_entity" DROP COLUMN "newColumn"`);
  }
}
```

### Rules

- `synchronize: false` — always use migrations
- `migrationsRun: true` — auto-run on startup
- Raw SQL in migrations (not queryBuilder)
- Always include `down()` for rollback
- File naming: `{TIMESTAMP}-{PascalCaseDescription}.ts`

---

## AI Model Integration

### Available Models

```typescript
type ModelType =
  | 'claude-opus-4-6'
  | 'claude-sonnet-4-6'
  | 'gpt-4o-mini'
  | 'gpt-4.1'
  | 'gemini-2.0-flash'
  | 'deepseek'
  | 'qwen';
```

### Using Models

```typescript
import { getModel } from '../../ai/models/models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

// Structured output (returns typed object)
const model = getModel('claude-sonnet-4-6', 0.3);
const structured = model.withStructuredOutput<MyType>(MY_ZOD_SCHEMA, {
  name: 'MyType',
});
const result = await structured.invoke([
  new SystemMessage('...'),
  new HumanMessage('...'),
]);

// Streaming (returns Observable)
const parser = new StringOutputParser();
const chain = model.pipe(parser);
const stream = await chain.stream(messages);
```

---

## Stripe Integration

### Webhook Route (raw body)

```typescript
// main.ts — MUST be before express.json()
app.use('/checkout/webhook', express.raw({ type: 'application/json' }));
```

### Subscription Tiers

- `basic` — 1 active project
- `pro` — 5 active projects
- `business` — unlimited

---

## Utility Functions

### notReachable (exhaustive switches)

```typescript
import { notReachable } from '../../shared/utils/notReachable';

switch (status) {
  case 'active':
    return handleActive();
  case 'completed':
    return handleCompleted();
  default:
    return notReachable(status); // Compile error if cases missing
}
```

---

## Import Conventions

```typescript
// 1. External packages
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// 2. Internal modules (relative paths, no aliases)
import { Project } from '../entities/project.entity';
import { notReachable } from '../../../../shared/utils/notReachable';
```

No path aliases configured — all imports use relative paths.

---

## Error Handling

```typescript
// Service level
throw new NotFoundException('Entity not found');
throw new BadRequestException('Invalid operation');

// Controller level (ownership)
if (entity.userId !== user.id) {
  throw new UnauthorizedException('Permissions denied');
}

// AI error recovery
try {
  await this.updatePartial(id, { status: 'processing' });
  const result = await this.aiService.generate(input);
  await this.updatePartial(id, { ...result, status: 'done' });
} catch (error) {
  await this.updatePartial(id, { status: 'error' });
}
```

---

## Checklist: Adding a New Module

1. **Entity** — Create `entities/{name}.entity.ts` with TypeORM decorators
2. **Migration** — Run `npm run typeorm migration:generate -- src/migration/Create{Name}Table`
3. **Types** — Create `types/entity.ts` with Zod schemas and TS types
4. **Mapper** — Create `mappers/map{Name}ToEntity.ts`
5. **Service** — Create `services/{name}.service.ts` with repository injection
6. **AI Service** — Create `services/{name}-ai.service.ts` if AI logic needed
7. **Controller** — Create `controllers/{name}.controller.ts` with `@UseGuards(JwtAuthGuard)`
8. **Pipe** — Create `pipes/{name}-by-id.pipe.ts` if entity lookup from params needed
9. **Listener** — Create `listeners/{event}.listener.ts` if event-driven
10. **Module** — Create `{name}.module.ts` importing TypeOrmModule.forFeature
11. **App Module** — Add entity to entities array + import module in `app.module.ts`
