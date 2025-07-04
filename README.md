# 🌍 Gurbetci Server

A comprehensive backend API for connecting aspiring abroad workers/students with people already abroad. Built with TypeScript, Express.js, Prisma, and WebSockets.

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT Authentication** with refresh tokens
- **Google OAuth 2.0** integration
- **Role-based access** (Explorer/Abroader)
- **Rate limiting** for security

### 🏙️ City Reviews & Insights
- **City ratings** (Job opportunities, Cost of living, Safety, Transport, Community)
- **Review management** with user verification
- **Search & filter** cities by country/name
- **Average ratings** calculation

### 📝 Posts & Experience Sharing
- **Rich post creation** with tags and city association
- **Comment system** with nested discussions
- **Like/Unlike** functionality
- **Search & filter** by tags, content, and location

### 💬 Real-time Chat System
- **WebSocket-powered** real-time messaging
- **Room management** (Country-based, Study groups, Interview prep)
- **Online status** tracking
- **Typing indicators**
- **Message history** with pagination

### 🛡️ Security & Performance
- **Input validation** with express-validator
- **SQL injection** protection via Prisma
- **CORS** configuration
- **Helmet** security headers
- **Request rate limiting**

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** database
- **npm** or **yarn**

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd gurbetci-server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gurbetci_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

4. **Set up the database:**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed with sample data
npm run db:seed
```

5. **Start the development server:**
```bash
npm run dev
```

The server will start on `http://localhost:3000` with WebSocket support.

## 📚 API Documentation

### 🔑 Authentication Endpoints

```
POST /api/auth/register     # Register new user
POST /api/auth/login        # Login user
POST /api/auth/logout       # Logout user
GET  /api/auth/profile      # Get user profile
PUT  /api/auth/profile      # Update profile
```

### 🏙️ City & Review Endpoints

```
GET  /api/cities            # List cities with ratings
POST /api/cities/reviews    # Create city review
```

### 📝 Post Endpoints

```
GET  /api/posts             # List posts (with filters)
POST /api/posts             # Create new post
GET  /api/posts/:id         # Get post details
POST /api/posts/:id/like    # Like/unlike post
POST /api/posts/:id/comments # Add comment
```

### 💬 Room & Chat Endpoints

```
GET  /api/rooms             # List chat rooms
POST /api/rooms             # Create new room
GET  /api/rooms/:id         # Get room details
POST /api/rooms/:id/join    # Join room
POST /api/rooms/:id/leave   # Leave room
GET  /api/rooms/:id/messages # Get message history
```

### 👥 User Management

```
GET  /api/users             # List users
GET  /api/users/:id         # Get user profile
PUT  /api/users/:id         # Update user
DELETE /api/users/:id       # Delete user
```

## 🔌 WebSocket Events

### Client to Server:
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server to Client:
- `new_message` - Receive new message
- `user_online` - User came online
- `user_offline` - User went offline
- `user_typing` - User is typing
- `user_stopped_typing` - User stopped typing
- `joined_room` - Successfully joined room
- `left_room` - Successfully left room
- `error` - Error occurred

## 🧪 Sample Data

After running `npm run db:seed`, you'll have:

- **2 test users** (Explorer & Abroader)
- **2 cities** with reviews (Berlin, Amsterdam)
- **Sample posts** with comments
- **Chat room** with messages

**Test Credentials:**
- Explorer: `explorer@example.com` / `password123`
- Abroader: `abroader@example.com` / `password123`

## 🛠️ Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
npm run db:seed          # Seed the database
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🚀 Performance Optimizations

### N+1 Query Problem Resolution

The application had several N+1 query issues that have been comprehensively resolved with optimized implementations:

#### ❌ **Problems Identified**
1. **Posts with Comments**: Fetching all posts (1 query) + fetching comments for each post (N queries)
2. **Cities with Reviews**: Fetching all cities (1 query) + fetching reviews for each city (N queries)  
3. **Rooms with Members/Messages**: Fetching all rooms (1 query) + fetching members/messages for each room (N queries)
4. **Users with Activity**: Fetching all users (1 query) + fetching posts/comments/reviews for each user (N queries)

#### ✅ **Solutions Implemented**

1. **Posts with Comments (Optimized)**
   ```
   GET /api/posts/with-comments?page=1&limit=10&cityId=uuid&search=query
   ```
   - Returns posts with their first 5 comments
   - Includes `hasMoreComments` flag
   - **1 database query** instead of N+1

2. **Post Comments (Paginated)**
   ```
   GET /api/posts/{postId}/comments?page=1&limit=20
   ```
   - Paginated comments for specific posts
   - Optimized for loading more comments

3. **Cities with Reviews (Optimized)**
   ```
   GET /api/cities/with-reviews?page=1&limit=20&search=query&country=filter
   ```
   - Returns cities with their first 3 reviews
   - Includes `hasMoreReviews` flag and `averageRatings`
   - **1 database query** instead of N+1

4. **Rooms with Members and Messages (Optimized)**
   ```
   GET /api/rooms/with-members-messages?page=1&limit=10&type=COUNTRY
   ```
   - Returns rooms with first 5 members and last 3 messages
   - Includes `hasMoreMembers`, `hasMoreMessages`, and `lastMessage`
   - **1 database query** instead of N+1

5. **Users with Activity (Optimized)**
   ```
   GET /api/users/with-activity?page=1&limit=20&role=EXPLORER&isOnline=true
   ```
   - Returns users with their recent posts, comments, and reviews
   - Includes activity flags and `totalActivity` count
   - **1 database query** instead of N+1

#### 📊 **Performance Impact**
- **Before**: Up to **N+1 queries** per endpoint (could be 21+ queries for 20 items)
- **After**: **1 optimized query** per endpoint
- **Result**: **~95% reduction** in database queries across all endpoints
- **Benefits**: 
  - ⚡ Faster response times
  - 📈 Better scalability
  - 💡 Enhanced user experience
  - 🔋 Reduced server load

#### 🛠 **Implementation Strategy**
- **Smart Limiting**: Fetch limited related data (3-5 items) to avoid oversized responses
- **Include Relations**: Use Prisma's `include` with nested selections
- **Separate Pagination**: Individual endpoints for loading more data when needed
- **Activity Flags**: `hasMore*` indicators for frontend pagination
- **Calculated Fields**: Client-side calculations for averages and totals

#### 🎯 **Usage Examples**

```typescript
// Before (N+1 Queries) ❌
const posts = await prisma.post.findMany(); // 1 query
for (const post of posts) {
  const comments = await prisma.comment.findMany({ 
    where: { postId: post.id } 
  }); // N queries
}

// After (1 Query) ✅
const posts = await prisma.post.findMany({
  include: {
    comments: { take: 5, include: { user: true } },
    _count: { select: { comments: true } }
  }
}); // 1 query only!
```

---

**Built with ❤️ for the global community of abroad seekers and helpers.** 

## Production Cookie Domain Setup

To ensure authentication cookies work across your frontend and backend in production (especially when deployed on different subdomains or domains), you **must** set the `COOKIE_DOMAIN` environment variable in your backend deployment environment.

### Why?
- Without `COOKIE_DOMAIN`, cookies are only valid for the backend's domain, and will not be accessible to the frontend if it's on a different domain or subdomain.
- Setting `COOKIE_DOMAIN` to a common parent domain (e.g., `.yourdomain.com` or `.vercel.app` if both are subdomains) allows cookies to be shared cross-origin (with `SameSite=None` and `Secure=true`).

### How to set
- In your production environment (Vercel, Railway, etc.), add an environment variable:
  - `COOKIE_DOMAIN=.gurbetlik-client.vercel.app` (or your actual parent domain)
- Example for Vercel:
  - Go to your project settings → Environment Variables
  - Add: `COOKIE_DOMAIN` = `.gurbetlik-client.vercel.app`

### Backend Code Reference
- The backend reads this variable and sets the cookie domain accordingly in `src/controllers/AuthController.ts`:
  ```js
  if (process.env.COOKIE_DOMAIN) {
    domain: process.env.COOKIE_DOMAIN
  }
  ```

### Additional Notes
- Make sure your frontend requests use `credentials: 'include'` (fetch) or `withCredentials: true` (axios).
- CORS must allow credentials and the correct origin (already handled in `src/index.ts`).
- Cookies will only be set on HTTPS in production (`secure: true`). 